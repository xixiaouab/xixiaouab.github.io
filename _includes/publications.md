<h2 id="publications" style="margin: 2px 0px -15px;">📖 Selected Publications <small style="font-size: 70%;">(* equal contribution)</small></h2>

<div class="publications">
<ol class="bibliography">

{% for link in site.data.publications %}


<li>
  <div class="pub-row" style="display: flex; flex-wrap: wrap; margin-bottom: 15px;">
    
    <!-- Image & Badge -->
    <div class="col-sm-3 abbr" style="padding-right: 15px; padding-left: 15px;">
      {% if link.image %}
        <div style="position: relative;">
          <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width: 100%; max-height: 130px; object-fit: cover; border-radius: 6px;">
          {% if link.conference_short %}
            <abbr class="badge" style="position: absolute; top: 6px; left: 6px; background-color: #007bff; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
              {{ link.conference_short }}
            </abbr>
          {% endif %}
        </div>
      {% endif %}
    </div>

    <!-- Text Content -->
    <div class="col-sm-9" style="padding-left: 20px;">
      <div class="title">
        {% if link.pdf %}
          <a href="{{ link.pdf }}" target="_blank">{{ link.title }}</a>
        {% else %}
          {{ link.title }}
        {% endif %}
      </div>

      <div class="author" style="margin-top: 2px;">{{ link.authors }}</div>

      <div class="periodical" style="margin-top: 2px;">
        <em>{{ link.conference }}</em>
      </div>

      <div class="links" style="margin-top: 6px;">
        {% if link.pdf %}
          <a href="{{ link.pdf }}" class="btn btn-sm z-depth-0" role="button" target="_blank">PDF</a>
        {% endif %}
        {% if link.code %}
          <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank">Code</a>
        {% endif %}
        {% if link.page %}
          <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank">Project Page</a>
        {% endif %}
        {% if link.bibtex %}
          <a href="{{ link.bibtex }}" class="btn btn-sm z-depth-0" role="button" target="_blank">BibTex</a>
        {% endif %}
        {% if link.notes %}
          {% if link.notes == "Accepted" %}
            <span class="badge badge-success" style="font-size: 12px;">Accepted</span>
          {% elsif link.notes == "Under review" %}
            <span class="badge badge-warning" style="font-size: 12px;">Under Review</span>
          {% else %}
            <span class="badge badge-secondary" style="font-size: 12px;">{{ link.notes }}</span>
          {% endif %}
        {% endif %}
        {% if link.others %}
          <span style="font-size: 12px;">{{ link.others }}</span>
        {% endif %}
      </div>
    </div>
  </div>
</li>

{% endfor %}

</ol>
</div>
