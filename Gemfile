source "https://rubygems.org" 

gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-paginate-v2" # <--- Puraane wale ko hata kar sateek v2 plugin lock kar diya hai
end

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
