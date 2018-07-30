using System;
using System.Linq;
using System.IO;
using System.Text.RegularExpressions;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Version = Lucene.Net.Util.Version;
using System.Collections.Generic;

namespace LuceneSearch
{
    public class SampleData
    {

        public string Content;
        public string FileName { get; internal set; }
        public string Title { get; internal set; }
    }

    public static class DocSearcher
    {

        private static string _luceneDir = @"c:\users\mblome\OfflineHelp2\index";
        private static FSDirectory _directoryTemp;
        private static FSDirectory _directory
        {
            get
            {
                if (_directoryTemp == null) _directoryTemp = FSDirectory.Open(new DirectoryInfo(_luceneDir));
                if (IndexWriter.IsLocked(_directoryTemp)) IndexWriter.Unlock(_directoryTemp);
                var lockFilePath = Path.Combine(_luceneDir, "write.lock");
                if (File.Exists(lockFilePath)) File.Delete(lockFilePath);
                return _directoryTemp;
            }
        }
        private static SampleData _mapLuceneDocumentToData(Document doc)
        {
            return new SampleData
            {
                FileName = doc.Get("FileName"),
                Title = doc.Get("Title"),
                Content = doc.Get("Content"),
            };
        }

        private static IEnumerable<SampleData> _mapLuceneToDataList(IEnumerable<Document> hits)
        {
            return hits.Select(_mapLuceneDocumentToData).ToList();
        }

        private static IEnumerable<SampleData> _mapLuceneToDataList(IEnumerable<ScoreDoc> hits,
            IndexSearcher searcher)
        {
            return hits.Select(hit => _mapLuceneDocumentToData(searcher.Doc(hit.Doc))).ToList();
        }

        private static Query parseQuery(string searchQuery, QueryParser parser)
        {
            Query query;
            try
            {
                query = parser.Parse(searchQuery.Trim());
            }
            catch (ParseException)
            {
                query = parser.Parse(QueryParser.Escape(searchQuery.Trim()));
            }
            return query;
        }

        private static IEnumerable<SampleData> _search
    (string searchQuery, string searchField = "")
        {
            // validation
            if (string.IsNullOrEmpty(searchQuery.Replace("*", "").Replace("?", ""))) return new List<SampleData>();

            // set up lucene searcher
            using (var searcher = new IndexSearcher(_directory, false))
            {
                var hits_limit = 1000;
                var analyzer = new StandardAnalyzer(Version.LUCENE_30);

                // search by single field
                //if (!string.IsNullOrEmpty(searchField))
                //{
                //    var parser = new QueryParser(Version.LUCENE_30, searchField, analyzer);
                //    var query = parseQuery(searchQuery, parser);
                //    var hits = searcher.Search(query, null, hits_limit, Sort.RELEVANCE).ScoreDocs;
                //    var results = _mapLuceneToDataList(hits, searcher);
                //    analyzer.Close();
                //    searcher.Dispose();
                //    return results;
                //}
                // search by multiple fields(ordered by RELEVANCE)
                //else
                //{
                var parser = new MultiFieldQueryParser
                    (Version.LUCENE_30, new[] { "FileName", "Title", "Content" }, analyzer);
                var query = parseQuery(searchQuery, parser);
                var hits = searcher.Search
                (query, null, hits_limit, Sort.RELEVANCE).ScoreDocs;
                var results = _mapLuceneToDataList(hits, searcher);
                analyzer.Close();
                searcher.Dispose();
                return results;
                //}
            }
        }

        public static IEnumerable<SampleData> Search(string input, string fieldName = "")
        {
            if (string.IsNullOrEmpty(input)) return new List<SampleData>();

            var terms = input.Trim().Replace("-", " ").Split(' ')
                .Where(x => !string.IsNullOrEmpty(x)).Select(x => x.Trim() + "*");
            input = string.Join(" ", terms);

            return _search(input, fieldName);
        }

        public static IEnumerable<SampleData> GetAllIndexRecords()
        {
            // validate search index
            if (!System.IO.Directory.EnumerateFiles(_luceneDir).Any()) return new List<SampleData>();

            // set up lucene searcher
            var searcher = new IndexSearcher(_directory, false);
            var reader = IndexReader.Open(_directory, false);
            var docs = new List<Document>();
            var term = reader.TermDocs();
            while (term.Next()) docs.Add(searcher.Doc(term.Doc));
            reader.Dispose();
            searcher.Dispose();
            return _mapLuceneToDataList(docs);
        }
    }
}
