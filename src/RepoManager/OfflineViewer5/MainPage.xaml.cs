using LuceneIndexer;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace OfflineViewer5
{
    public class RepoInfo
    {
        public string Name { get; set; }

        public string Description { get; set; }
        public string LastUpdated { get; set; }
        public string Url { get; set; }
    }

    /// <summary>
    /// Interaction logic for MainPage.xaml
    /// </summary>
    public partial class MainPage : Page
    {
        private static HttpClient httpClient = new HttpClient();
        public ObservableCollection<RepoInfo> repos_available_for_download;
        public ObservableCollection<RepoInfo> repos_installed;
        ~MainPage()
        {
            httpClient.Dispose();
        }

        public MainPage()
        {
            InitializeComponent();
            // Add an Accept header for JSON format.
            httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
            //GitHub requires a user agent
            httpClient.DefaultRequestHeaders.Add("User-Agent", "mikeblome");

            repos_available_for_download = new ObservableCollection<RepoInfo>()
            {
            new RepoInfo{Name="cpp-docs", Description="Visual C++", LastUpdated="n/a", Url="https://github.com/MicrosoftDocs/cpp-docs.git" },
            new RepoInfo{Name="sql-docs", Description="SQL", LastUpdated="n/a", Url="https://github.com/MicrosoftDocs/sql-docs.git" },
            new RepoInfo{Name="windows-uwp", Description="Windows UWP", LastUpdated="n/a", Url="https://github.com/MicrosoftDocs/windows-uwp.git" },
            new RepoInfo{Name="dotnet", Description=".NET", LastUpdated="n/a", Url="https://github.com/dotnet/docs.git" }
            };
            lv_for_download.ItemsSource = repos_available_for_download;

            repos_installed = new ObservableCollection<RepoInfo>();
            GetInstalledRepos();
            lv_installed_repos.ItemsSource = repos_installed;
        }

        private void GetInstalledRepos()
        {
            string repo_root = @"%USERPROFILE%\OfflineHelp2\";
            var filePath = Environment.ExpandEnvironmentVariables(repo_root);
            var di = new System.IO.DirectoryInfo(filePath);
            if (!di.Exists)
            {
                System.IO.Directory.CreateDirectory(filePath);
            }
            var dirs = System.IO.Directory.GetDirectories(filePath, "*.*", System.IO.SearchOption.TopDirectoryOnly);
            foreach (var dir in dirs)
            {
                System.IO.DirectoryInfo info = new System.IO.DirectoryInfo(dir);
                repos_installed.Add(new RepoInfo() { Name = info.Name, Description = "a repo", LastUpdated = "who knows", Url = "n/a" });
            }
        }

        private async void GetRepoInfo_Click(object sender, RoutedEventArgs e)
        {
            string url = "https://api.github.com/organizations/22479449/repos?type=%22public%22%3Fper_page%3D100&page=2";
            // string url = "https://api.github.com/orgs/MicrosoftDocs/repos?type=\"public\"";
            List<string> parts = new List<string>();
            do
            {

                string linkHeader = await CreateGetRepoInfoAsync(url);
                var temp = linkHeader.Split(',');
                if (temp.Count() > 1)
                {
                    foreach (var header in temp)
                        if (header.Contains("rel=\"next\""))
                        {
                            var match = Regex.Match(header, "<(.*?)>.*");
                            url = match.Groups[1].ToString();
                            break;
                        }
                }
                await Task.Delay(5000);
            } while (true);

        }

        private async Task<string> CreateGetRepoInfoAsync(string url)
        {
            // MainPage data response.
            HttpResponseMessage response = new HttpResponseMessage();

            try
            {
                response = await httpClient.GetAsync(url);
            }
            catch (HttpRequestException ex)
            {
                return ex.InnerException.Message;
            }
            if (response != null && response.IsSuccessStatusCode)
            {

                // Parse the response body.
                var result = await response.Content.ReadAsStringAsync();
                var objs = JArray.Parse(result);
                StringBuilder sb = new StringBuilder();

                foreach (var o in objs)
                {
                    var x = JObject.FromObject(o);
                    var ri = new RepoInfo();
                    ri.Name = x.GetValue("name").ToString();
                    ri.Description = x.GetValue("description").ToString();
                    ri.LastUpdated = x.GetValue("updated_at").ToString();
                    repos_available_for_download.Add(ri);
                }

                var vals = response.Headers.GetValues("Link");
                foreach (var v in vals)
                {
                    sb.Append(v);
                }
                return sb.ToString();
            }
            else
            {
                return String.Format("{0} ({1})", (int)response.StatusCode, response.ReasonPhrase);
            }
        }

        private void CloneRepo_Click(object sender, RoutedEventArgs e)
        {
            List<string> selected_items = new List<string>();
            foreach (var item in lv_for_download.SelectedItems)
            {
                RepoInfo ri = (RepoInfo)item;
                selected_items.Add(ri.Url);
                StartClone(ri);
            }
        }

        private void StartClone(RepoInfo ri)
        {
            var pathWithEnv = @"%USERPROFILE%\OfflineHelp2\";
            var filePath = Environment.ExpandEnvironmentVariables(pathWithEnv);
            var gitPath = Environment.ExpandEnvironmentVariables(@"C:\Program Files\Git\git-cmd.exe");
            string clone = "git clone " + ri.Url + " " + filePath + ri.Name;
            System.Diagnostics.Process.Start(gitPath, clone);
        }

        private void RemoveRepo_Click(object sender, RoutedEventArgs e)
        {
        }

        private void UpdateRepo_Click(object sender, RoutedEventArgs e)
        {

            var pathWithEnv = @"%USERPROFILE%\OfflineHelp2\";
            var filePath = Environment.ExpandEnvironmentVariables(pathWithEnv);
            var gitPath = Environment.ExpandEnvironmentVariables(@"C:\Program Files\Git\git-cmd.exe");
            List<string> selected_items = new List<string>();

            foreach (var item in lv_installed_repos.SelectedItems)
            {
                RepoInfo ri = (RepoInfo)item;
                ProcessStartInfo info = new ProcessStartInfo();
                info.FileName = gitPath;
                info.WorkingDirectory = filePath + ri.Name;
                Process proc = new Process();
                info.Arguments = @"git pull origin master";
                proc.StartInfo = info;
                proc.Start();
            }
        }

        private void RefreshUI_Click(object sender, RoutedEventArgs e)
        {
            repos_installed.Clear();
            GetInstalledRepos();
        }

        private void UpdateIndex_Click(object sender, RoutedEventArgs e)
        {
            string repo_root = @"%USERPROFILE%\OfflineHelp2\";
            var filePath = Environment.ExpandEnvironmentVariables(repo_root);
            var di = new System.IO.DirectoryInfo(filePath);

            LuceneIndexer.OfflineIndexer.ClearLuceneIndex();
            OfflineIndexer.AddUpdateLuceneIndex(di);
        }

        private void SearchButton_Click(object sender, RoutedEventArgs e)
        {
            var mainWin = (NavigationWindow)Application.Current.MainWindow;
            mainWin.Navigate(new Search());
        }
    }
}
