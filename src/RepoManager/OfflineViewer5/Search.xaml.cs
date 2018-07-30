using LuceneSearch;
using LuceneIndexer;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
    /// <summary>
    /// Interaction logic for Search.xaml
    /// </summary>
    public partial class Search : Page
    {
        public Search()
        {
            InitializeComponent();
        }

        private void Go_Click(object sender, RoutedEventArgs e)
        {
            var results = LuceneSearch.DocSearcher.Search(tbSearchTerm.Text);
            lvResults.Items.Clear();
            foreach (var item in results)
            {
                lvResults.Items.Add(item.FileName);
            }
        }
    }
}
