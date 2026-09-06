# Privacy

## Local application and model providers

Legends SEO Dungeon runs a local browser UI and local CLI bridge. HTML parsing,
report generation, saved reports, and session logs use your own machine. The
application has no built-in telemetry or analytics collection.

Selected AI CLIs send prompts, supplied site content, and any files they read to
their configured model provider under that provider’s account and privacy terms.
A local CLI does not imply local-only model processing. Website fetches contact
the target site. Optional SEO APIs contact their respective services.

Generated reports, screenshots, local browser storage, and bridge logs can
contain your domains, project paths, and findings. Review these before sharing
an archive or recording; ignoring files in Git does not remove local copies.

## Extension APIs

Optional extensions make API calls to third-party services when you invoke their commands:

| Extension | Service | Data Sent | Privacy Policy |
|-----------|---------|-----------|---------------|
| **DataForSEO** | api.dataforseo.com | URLs and domains you analyze | [DataForSEO Privacy](https://dataforseo.com/privacy-policy) |
| **Firecrawl** | api.firecrawl.dev | URLs you crawl or scrape | [Firecrawl Privacy](https://www.firecrawl.dev/privacy) |
| **Banana (Gemini)** | generativelanguage.googleapis.com | Image generation prompts | [Google AI Privacy](https://ai.google.dev/terms) |

## Backlink APIs

When configured with backlink API credentials, these scripts transmit data to third-party services:

| Script | Service | Data Sent | Privacy Policy |
|--------|---------|-----------|---------------|
| `moz_api.py` | Moz Link Explorer API | Domains you analyze | [Moz Privacy](https://moz.com/privacy-policy) |
| `bing_webmaster.py` | Bing Webmaster Tools API | Domains you analyze | [Microsoft Privacy](https://privacy.microsoft.com/) |
| `commoncrawl_graph.py` | Common Crawl | Domains (public dataset query) | [Common Crawl Terms](https://commoncrawl.org/terms-of-use) |
| `verify_backlinks.py` | Target URLs directly | URLs to verify backlink existence | N/A (direct HTTP requests) |

## Google SEO APIs

When configured with Google API credentials, these scripts transmit data to Google:

| Script | Google API | Data Sent |
|--------|-----------|-----------|
| `pagespeed_check.py` | PageSpeed Insights | URL to analyze |
| `gsc_query.py` | Search Console | Authenticated query for your verified properties |
| `gsc_inspect.py` | URL Inspection | URLs to inspect |
| `indexing_notify.py` | Indexing API | URLs to submit for indexing |
| `ga4_report.py` | Analytics Data | Authenticated query for your GA4 properties |
| `crux_history.py` | CrUX History | URL or origin to query |
| `nlp_analyze.py` | Cloud Natural Language | Text content for entity / sentiment / category analysis |
| `keyword_planner.py` | Google Ads (Keyword Planner) | Seed keywords for volume, CPC, and competition lookups |
| `youtube_search.py` | YouTube Data API v3 | Search queries for YouTube SEO research |

Google API usage is governed by [Google's Privacy Policy](https://policies.google.com/privacy) and the [Google API Terms of Service](https://developers.google.com/terms).

## Credentials

- API keys and OAuth tokens are stored locally in `~/.config/claude-seo/` or environment variables
- Keep credentials out of Git. Ignore rules and the release privacy check help
  catch accidental inclusion, but do not replace reviewing your changes.
- OAuth tokens use refresh tokens and never store client secrets in token files
