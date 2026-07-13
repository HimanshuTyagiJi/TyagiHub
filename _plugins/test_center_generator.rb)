# _plugins/test_center_generator.rb
# TyagiHub Test Center — Build-time Page Generator Engine
# Auto-detects question counts and generates fully mapped static URLs to prevent 404 errors.

require 'json'

module TyagiHub
  class TestHubPage < Jekyll::Page
    def initialize(site, base, dir, filename, data_override, layout_name)
      @site = site
      @base = base
      @dir  = dir
      @name = filename

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), layout_name)
      self.data.merge!(data_override)
    end
  end

  class TestCenterGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      # प्रति पार्ट प्रश्नों का सेट (यूज़र की डिमांड के अनुसार 25 प्रश्न)
      qpp = 25 

      # ----------------------------------------------------------------
      # 1. ENGLISH CATEGORIES ENGINE
      # ----------------------------------------------------------------
      (site.config.dig('categories', 'english') || []).each do |cat|
        # डेटा फ़ाइल का नाम और पाथ मैपिंग (जैसे quiz/en/ancient-indian-history)
        file_id = cat['data_file'].split('/').last
        questions = load_test_questions(site, cat['data_file'])
        total_questions = questions.size

        # अगर प्रश्न नहीं भी हैं, तो कम से कम 1 खाली पार्ट ज़रूर दिखाएंगे ताकि पेज खाली न रहे
        total_parts = total_questions > 0 ? (total_questions.to_f / qpp).ceil : 1
        
        # कैटेगरी रूट यूआरएल (जैसे: /history-test/)
        hub_dir = "#{cat['id']}-test"
        
        # ए. कैटेगरी हब पेज जेनरेट करना
        hub_data = {
          'layout' => 'default',
          'title' => "#{cat['title']} Mock Test Hub",
          'description' => "Practice free timed mock tests for #{cat['title']} with live leaderboards.",
          'category_id' => cat['id'],
          'category_title' => cat['title'],
          'total_questions' => total_questions,
          'total_parts' => total_parts,
          'lang' => 'en',
          'permalink' => "/#{hub_dir}/"
        }
        site.pages << TestHubPage.new(site, site.source, hub_dir, 'index.html', hub_data, 'test-hub-layout.html')

        # बी. सभी पार्ट्स के प्लेयर पेज जेनरेट करना (जैसे: /history-test/part-01/)
        total_parts.times do |p_idx|
          part_num = p_idx + 1
          part_str = part_num < 10 ? "part-0#{part_num}" : "part-#{part_num}"
          
          player_data = {
            'layout' => 'default',
            'title' => "#{cat['title']} - Part #{part_num < 10 ? "0#{part_num}" : part_num} Live Test",
            'quiz_id' => "#{cat['id']}-test-#{part_str}",
            'category_id' => cat['id'],
            'part_index' => part_num,
            'questions_per_page' => qpp,
            'lang' => 'en',
            'permalink' => "/#{hub_dir}/#{part_str}/"
          }
          site.pages << TestHubPage.new(site, site.source, "#{hub_dir}/#{part_str}", 'index.html', player_data, 'test-player-layout.html')
        end
      end

      # ----------------------------------------------------------------
      # 2. HINDI CATEGORIES ENGINE
      # ----------------------------------------------------------------
      (site.config.dig('categories', 'hindi') || []).each do |cat|
        file_id = cat['data_file'].split('/').last
        questions = load_test_questions(site, cat['data_file'])
        total_questions = questions.size
        total_parts = total_questions > 0 ? (total_questions.to_f / qpp).ceil : 1
        
        # हिंदी पाथ स्ट्रक्चर (जैसे: /hi/history-test/)
        hub_dir = "hi/#{cat['id']}-test"
        
        # ए. हिंदी कैटेगरी हब पेज जेनरेट करना
        hub_data = {
          'layout' => 'default',
          'title' => "#{cat['title']} लाइव मॉक टेस्ट हब",
          'description' => "#{cat['title']} प्रतियोगी परीक्षाओं के लिए समयबद्ध मुफ्त मॉक टेस्ट सीरीज।",
          'category_id' => cat['id'],
          'category_title' => cat['title'],
          'total_questions' => total_questions,
          'total_parts' => total_parts,
          'lang' => 'hi',
          'permalink' => "/#{hub_dir}/"
        }
        site.pages << TestHubPage.new(site, site.source, hub_dir, 'index.html', hub_data, 'test-hub-layout.html')

        # बी. हिंदी पार्ट्स के प्लेयर पेज जेनरेट करना (जैसे: /hi/history-test/part-01/)
        total_parts.times do |p_idx|
          part_num = p_idx + 1
          part_str = part_num < 10 ? "part-0#{part_num}" : "part-#{part_num}"
          
          player_data = {
            'layout' => 'default',
            'title' => "#{cat['title']} - भाग #{part_num < 10 ? "0#{part_num}" : part_num} लाइव टेस्ट",
            'quiz_id' => "#{cat['id']}-test-#{part_str}",
            'category_id' => cat['id'],
            'part_index' => part_num,
            'questions_per_page' => qpp,
            'lang' => 'hi',
            'permalink' => "/#{hub_dir}/#{part_str}/"
          }
          site.pages << TestHubPage.new(site, site.source, "#{hub_dir}/#{part_str}", 'index.html', player_data, 'test-player-layout.html')
        end
      end
    end

    private

    def load_test_questions(site, data_file)
      parts = data_file.split('/')
      data  = site.data
      parts.each { |p| data = data[p] rescue nil; break if data.nil? }
      data.is_a?(Array) ? data : []
    end
  end
end
