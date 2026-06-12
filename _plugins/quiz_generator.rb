# _plugins/quiz_generator.rb
# TyagiHub GK Quiz — Build-time paginated page generator
# Reads JSON from _data/gk/*.json and generates fully rendered static HTML pages.
# Google gets complete pre-rendered HTML — no JS fetch needed.
 
require 'json'
 
module TyagiHub
  class QuizPage < Jekyll::Page
    def initialize(site, base, dir, filename, data_override)
      @site = site
      @base = base
      @dir  = dir
      @name = filename

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'quiz-player.html')
      self.data.merge!(data_override)
    end
  end

  class QuizGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      qpp = (site.config.dig('quiz', 'questions_per_page') || 2).to_i

      # ----------------------------------------------------------------
      # Process ENGLISH categories
      # ----------------------------------------------------------------
      (site.config.dig('categories', 'english') || []).each do |cat|
       questions = load_questions(site, cat['data_file'])
        next if questions.empty?

        total_pages = (questions.size.to_f / qpp).ceil
        base_url    = cat['url']   # e.g. /gk/ancient-indian-history/

        # Find the Hindi counterpart (same index in hindi array)
        hi_cats     = site.config.dig('categories', 'hindi') || []
        en_cats     = site.config.dig('categories', 'english') || []
        cat_index   = en_cats.index { |c| c['id'] == cat['id'] }
        hi_cat      = cat_index ? hi_cats[cat_index] : nil
        hi_base_url = hi_cat ? hi_cat['url'] : nil

        total_pages.times do |page_idx|
          page_num   = page_idx + 1
          page_start = page_idx * qpp
          page_qs    = questions[page_start, qpp]

          # URL: page 1 → /gk/ancient-indian-history/
          #      page 2 → /gk/ancient-indian-history/page-2/
          if page_num == 1
            dir      = base_url.sub(/^\//, '')     # strip leading slash for dir
            filename = 'index.html'
            page_url = base_url
          else
            dir      = "#{base_url.sub(/^\//, '')}page-#{page_num}"
            filename = 'index.html'
            page_url = "#{base_url}page-#{page_num}/"
          end

          # Build hi counterpart URL
          hi_page_url = nil
          if hi_base_url
            hi_page_url = page_num == 1 ? hi_base_url : "#{hi_base_url}page-#{page_num}/"
          end

          # SEO Title & Description
          seo_title = build_seo_title(cat['title'], page_num, total_pages, 'en')
          seo_desc  = build_seo_desc(cat['title'], page_num, qpp, page_start, questions.size, 'en', cat['description'])

          # Breadcrumb schema
          schema = breadcrumb_schema(site.config['url'], cat['title'], page_url, page_num)

          page_data = {
            'layout'           => 'quiz-player',
            'title'            => seo_title,
            'seo_title'        => seo_title,
            'seo_description'  => seo_desc,
            'description'      => seo_desc,
            'lang'             => 'en',
            'category_id'      => cat['id'],
            'category_title'   => cat['title'],
            'category_url'     => base_url,
            'questions'        => page_qs,
            'page_num'         => page_num,
            'total_pages'      => total_pages,
            'total_questions'  => questions.size,
            'qpp'              => qpp,
            'page_start_index' => page_start,
            'base_url'         => base_url,
            'canonical_url'    => page_url,
            'lang_en_url'      => page_url,
            'lang_hi_url'      => hi_page_url,
            'schema_json'      => schema,
          }

          quiz_page = QuizPage.new(site, site.source, dir, filename, page_data)
          quiz_page.data['url'] = page_url
          site.pages << quiz_page
        end
      end

      # ----------------------------------------------------------------
      # Process HINDI categories
      # ----------------------------------------------------------------
      (site.config.dig('categories', 'hindi') || []).each do |cat|
        questions = load_questions(site, cat['data_file'])
        next if questions.empty?

        total_pages = (questions.size.to_f / qpp).ceil
        base_url    = cat['url']   # e.g. /hi/gk/prachin-bharatiya-itihas/

        en_cats     = site.config.dig('categories', 'english') || []
        hi_cats     = site.config.dig('categories', 'hindi') || []
        cat_index   = hi_cats.index { |c| c['id'] == cat['id'] }
        en_cat      = cat_index ? en_cats[cat_index] : nil
        en_base_url = en_cat ? en_cat['url'] : nil

        total_pages.times do |page_idx|
          page_num   = page_idx + 1
          page_start = page_idx * qpp
          page_qs    = questions[page_start, qpp]

          if page_num == 1
            dir      = base_url.sub(/^\//, '')
            filename = 'index.html'
            page_url = base_url
          else
            dir      = "#{base_url.sub(/^\//, '')}page-#{page_num}"
            filename = 'index.html'
            page_url = "#{base_url}page-#{page_num}/"
          end

          en_page_url = nil
          if en_base_url
            en_page_url = page_num == 1 ? en_base_url : "#{en_base_url}page-#{page_num}/"
          end

          seo_title = build_seo_title(cat['title'], page_num, total_pages, 'hi')
          seo_desc  = build_seo_desc(cat['title'], page_num, qpp, page_start, questions.size, 'hi', cat['description'])
          schema    = breadcrumb_schema(site.config['url'], cat['title'], page_url, page_num)

          page_data = {
            'layout'           => 'quiz-player',
            'title'            => seo_title,
            'seo_title'        => seo_title,
            'seo_description'  => seo_desc,
            'description'      => seo_desc,
            'lang'             => 'hi',
            'category_id'      => cat['id'],
            'category_title'   => cat['title'],
            'category_url'     => base_url,
            'questions'        => page_qs,
            'page_num'         => page_num,
            'total_pages'      => total_pages,
            'total_questions'  => questions.size,
            'qpp'              => qpp,
            'page_start_index' => page_start,
            'base_url'         => base_url,
            'canonical_url'    => page_url,
            'lang_en_url'      => en_page_url,
            'lang_hi_url'      => page_url,
            'schema_json'      => schema,
          }

          quiz_page = QuizPage.new(site, site.source, dir, filename, page_data)
          quiz_page.data['url'] = page_url
          site.pages << quiz_page
        end
      end
    end

    private

    def load_questions(site, data_file)
      # data_file format: "gk/ancient-history-en"
      parts = data_file.split('/')
      data  = site.data
      parts.each { |p| data = data[p] rescue nil; break if data.nil? }
      data.is_a?(Array) ? data : []
    end

    def build_seo_title(cat_title, page_num, total_pages, lang)
      if lang == 'hi'
        page_num == 1 ?
          "#{cat_title} GK प्रश्नोत्तरी | TyagiHub" :
          "#{cat_title} GK Quiz - पृष्ठ #{page_num}/#{total_pages} | TyagiHub"
      else
        page_num == 1 ?
          "#{cat_title} GK Quiz Questions | TyagiHub" :
          "#{cat_title} GK Quiz - Page #{page_num} of #{total_pages} | TyagiHub"
      end
    end

    def build_seo_desc(cat_title, page_num, qpp, start_idx, total, lang, base_desc)
      q_from = start_idx + 1
      q_to   = [start_idx + qpp, total].min
      if lang == 'hi'
        "#{cat_title} के बहुविकल्पीय प्रश्न #{q_from}-#{q_to} (कुल #{total} प्रश्नों में से)। UPSC, SSC, Railway परीक्षा की तैयारी के लिए उत्तर और व्याख्या सहित। #{base_desc}"
      else
        "Practice #{cat_title} MCQ Questions #{q_from}–#{q_to} out of #{total}. Free quiz with answers and explanations for UPSC, SSC, Railway exam preparation. #{base_desc}"
      end
    end

    def breadcrumb_schema(site_url, cat_title, page_url, page_num)
      items = [
        { "@type" => "ListItem", "position" => 1, "name" => "Home",     "item" => site_url + "/" },
        { "@type" => "ListItem", "position" => 2, "name" => "GK Quiz",  "item" => site_url + "/gk/" },
        { "@type" => "ListItem", "position" => 3, "name" => cat_title,  "item" => site_url + page_url },
      ]
      if page_num > 1
        items << { "@type" => "ListItem", "position" => 4, "name" => "Page #{page_num}", "item" => site_url + page_url }
      end
      schema = { "@context" => "https://schema.org", "@type" => "BreadcrumbList", "itemListElement" => items }
      "<script type=\"application/ld+json\">#{schema.to_json}</script>"
    end
  end
end
