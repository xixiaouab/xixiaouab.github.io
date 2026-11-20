import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('stats', HERE.parent/'scripts/update_github_stats.py')
stats = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stats)
SID = 'Q4DnRVgAAAAJ'

def repo(name, repo_id, stars, owner=None):
    return {'full_name':name,'id':repo_id,'stargazers_count':stars,'private':False,
            'owner':{'login':owner or name.split('/')[0]}}

def paper(suffix, title, repos=()):
    return {'scholar_publication_id':SID+':'+suffix,'title':title,
            'repositories':[{'full_name':r,'evidence_url':'https://example.org/official-paper'} for r in repos]}

class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.projects = self.root/'projects.json'
        self.scholar = self.root/'scholar.json'
        self.output = self.root/'stats.json'
        self.config = {'schema_version':1,'profile':{'login':'xixiaouab','scholar_id':SID},
          'excluded_papers':[{'title':'Agent Harness Engineering: A Survey','scholar_publication_id':SID+':harness',
                              'repositories':[{'full_name':'Picrew/LLM-Harness'}, {'full_name':'Picrew/awesome-agent-harness','id':999}]}],
          'papers':[paper('one','Own paper',['xixiaouab/One']),
                    paper('two','Coauthored project',['friend/Shared','friend/SHARED','old/Shared']),
                    paper('three','Another paper using the same project',['friend/Shared']),
                    paper('harness','Agent Harness Engineering: A Survey',['Picrew/LLM-Harness','Picrew/awesome-agent-harness']),
                    paper('alias','Unrelated-looking renamed exclusion',['renamed/Catalog'])]}
        self.write()
    def tearDown(self): self.temp.cleanup()
    def write(self):
        self.projects.write_text(json.dumps(self.config))
        self.scholar.write_text(json.dumps({'profile':{'scholar_id':SID},'all_papers':[
            {'title':p['title'],'link':'https://scholar.google.com/citations?citation_for_view='+p['scholar_publication_id']}
            for p in self.config['papers']]}))
    def fetch(self,url):
        if '/users/' in url: return [repo('xixiaouab/One',1,21),repo('xixiaouab/Unmapped',2,4)]
        if url.endswith('/renamed/catalog'): return repo('new/Catalog',999,999999)
        if url.endswith(('/friend/shared','/old/shared')): return repo('friend/Shared',3,100)
        raise AssertionError('Unexpected request, including excluded harness: '+url)
    def test_deduplication_and_exclusion(self):
        with patch.object(stats,'request_json',side_effect=self.fetch):
            result=stats.collect_snapshot(self.projects,self.scholar)
        self.assertEqual(result['summary']['total_stars'],125)
        self.assertEqual(result['summary']['public_repository_count'],3)
        self.assertEqual(result['summary']['additional_research_repository_count'],1)
        shared=next(r for r in result['repositories'] if r['id']==3)
        self.assertEqual(len({p['scholar_publication_id'] for p in shared['papers']}),2)
        self.assertFalse(any('harness' in r['full_name'].lower() or r['id']==999 for r in result['repositories']))
    def test_failure_retains_complete_prior_snapshot(self):
        previous={'profile':{'login':'xixiaouab'},'summary':{'total_stars':123}}
        self.output.write_text(json.dumps(previous))
        args=['stats','--output',str(self.output),'--projects',str(self.projects),'--scholar',str(self.scholar),'--soft-fail']
        with patch.object(sys,'argv',args),patch.object(stats,'collect_snapshot',side_effect=RuntimeError('unavailable')):
            self.assertEqual(stats.main(),0)
        self.assertEqual(json.loads(self.output.read_text()),previous)
    def test_partial_fetch_failure_cannot_publish_lower_total(self):
        def failing(url):
            if url.endswith('/old/shared'):raise RuntimeError('rate limited')
            return self.fetch(url)
        with patch.object(stats,'request_json',side_effect=failing):
            with self.assertRaisesRegex(RuntimeError,'rate limited'):
                stats.collect_snapshot(self.projects,self.scholar)
    def test_paper_removed_from_scholar_no_longer_adds_project(self):
        self.config['papers'].append(paper('removed','Removed',['other/Removed']))
        self.projects.write_text(json.dumps(self.config))
        with patch.object(stats,'request_json',side_effect=self.fetch):
            result=stats.collect_snapshot(self.projects,self.scholar)
        self.assertEqual(result['summary']['total_stars'],125)
    def test_new_papers_are_reported_as_pending_not_invented(self):
        scholar=json.loads(self.scholar.read_text())
        scholar['all_papers'].append({'title':'New','link':'https://scholar.google.com/citations?citation_for_view='+SID+':new'})
        self.scholar.write_text(json.dumps(scholar))
        with patch.object(stats,'request_json',side_effect=self.fetch):result=stats.collect_snapshot(self.projects,self.scholar)
        self.assertEqual(result['coverage']['new_papers_pending_repository_audit'][0]['title'],'New')
    def test_malformed_exclusion_id_rejected(self):
        self.config['excluded_papers'][0]['repositories'][1]['id']='999'
        self.write()
        with self.assertRaisesRegex(ValueError,'positive integers'):
            stats.load_scope(self.projects,self.scholar)
    def test_private_repository_rejected(self):
        record=repo('friend/Shared',3,100);record['private']=True
        with self.assertRaises(ValueError):stats.validate_repository(record)
    def test_owned_pagination_retrieves_every_page(self):
        first=[repo('xixiaouab/Repo'+str(i),i+1,i) for i in range(100)]
        with patch.object(stats,'request_json',side_effect=[first,[repo('xixiaouab/Last',101,200)]]):
            result=stats.owned_repositories()
        self.assertEqual(len(result),101)
    def test_duplicate_pagination_is_failure(self):
        repeated=repo('xixiaouab/One',1,10)
        with patch.object(stats,'request_json',return_value=[repeated,repeated]):
            with self.assertRaises(ValueError):stats.owned_repositories()

if __name__=='__main__':unittest.main()
