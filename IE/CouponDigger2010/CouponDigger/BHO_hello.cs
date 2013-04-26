using System;
using SHDocVw;
using mshtml;
using Microsoft.Win32;
using System.Runtime.InteropServices;

namespace hello
{
    [
    ComVisible(true),
    Guid("8a194578-81ea-4850-9911-13ba2d71efbd"),
    ClassInterface(ClassInterfaceType.None)
    ]
    public class BHO : IObjectWithSite
    {

        WebBrowser webBrowser;
        HTMLDocument document;
        private string webUrl;

        public void OnDocumentComplete(object pDisp, ref object URL)
        {
            document = (HTMLDocument)webBrowser.Document;

            //IHTMLElement head = (IHTMLElement)((IHTMLElementCollection) document.all.tags("head")).item(null, 0);
            //IHTMLScriptElement scriptObject = (IHTMLScriptElement)document.createElement("script");
            //scriptObject.type = @"text/javascript";
            //scriptObject.text = "\nfunction hidediv(){document.getElementById" +
            //                    "('myOwnUniqueId12345').style.visibility = 'hidden';}\n\n";
            //((HTMLHeadElement)head).appendChild((IHTMLDOMNode)scriptObject);

            //string div = "<div id=\"myOwnUniqueId12345\" style=\"position:" +
            //             "fixed;bottom:0px;right:0px;z-index:9999;width=300px;" +
            //             "height=150px;\"> <div style=\"position:relative;" +
            //             "float:right;font-size:9px;\"><a " +
            //             "href=\"javascript:hidediv();\">close</a></div>" +
            //    "My content goes here ...</div>";

            string _reqUrl = URL as string;
            string siteUrl = webBrowser.LocationURL as string;
            string siteName = webBrowser.LocationName;
            string divStr;

            //if (String.IsNullOrEmpty(webUrl) || webUrl != siteUrl)
            if (_reqUrl == siteUrl)
            {
                // Reset current website url when visit it from other site
                webUrl = siteUrl;
                divStr = "<div id=\"cmusTest\" style=\"position: fixed; bottom: 5px; text-align: center; width: 100%; background-color: #000; color: #fff; height: 30px; line-height: 30px;\">"
                         + "CMUS BHO inject div --- Site name: " + siteName + "</div>";
                //divStr += "<div class=\"documentComplete\"><b>Document load complete, reqUrl is: " + _reqUrl + "<br> webUrl: " + siteUrl + " ; webName: " + siteName + "</b></div>";
                
                //hooking refresh handler
                this.HookRefresh();
            }
            else
            {
                return;
                //divStr = "<div class=\"documentComplete\">After document complete, reqUrl is: " + _reqUrl + "</div>";
            }

            document.body.insertAdjacentHTML("afterBegin", divStr);
            

            //foreach (IHTMLInputElement tempElement in document.getElementsByTagName("INPUT"))
            //{
            //    System.Windows.Forms.MessageBox.Show(
            //        tempElement.name != null ? tempElement.name : "it sucks, no name, try id" + ((IHTMLElement)tempElement).id
            //        );
            //}
        }

        private void HookRefresh()
        {
            if (document != null)
            {
                IHTMLWindow2 tmpWindow = document.parentWindow;
                if (tmpWindow != null)
                {
                    HTMLWindowEvents2_Event events = (tmpWindow as HTMLWindowEvents2_Event);
                    try
                    {
                        events.onload -= new HTMLWindowEvents2_onloadEventHandler(RefreshHandler);
                    }
                    catch { }
                    events.onload += new HTMLWindowEvents2_onloadEventHandler(RefreshHandler);
                }
            }
        }

        private void RefreshHandler(IHTMLEventObj e)
        {
            string div = "<div class=\"navigateComplete\"><b>Refresh Handler ....</b></div>";
            document.body.insertAdjacentHTML("afterBegin", div);
        }

        private void OnNavigateComplete2(object pDisp, ref object URL)
        {
            string url = URL as string;
            if (document == null)
            {
                document = (HTMLDocument)webBrowser.Document;
            }
            string div = "<div class=\"navigateComplete\">navigate complete, url is: " + url + "</div>";
            document.body.insertAdjacentHTML("afterBegin", div);

            //System.Windows.Forms.MessageBox.Show("navigate complete, url is: " + url);
            //System.Diagnostics.Debug.WriteLine("navigate complete, url is: " + url);
        }

        public void OnBeforeNavigate2(object pDisp, ref object URL, ref object Flags, ref object TargetFrameName, ref object PostData, ref object Headers, ref bool Cancel)
        {
            System.Windows.Forms.MessageBox.Show("Before navigate2 ...");
            //document = (HTMLDocument)webBrowser.Document;
            //foreach (IHTMLInputElement element in document.getElementsByTagName("INPUT"))
            //{
            //    if (element.type.ToLower() == "password")
            //    {
            //        System.Windows.Forms.MessageBox.Show(element.value);
            //    }
            //}
        }

        private void OnDownloadComplete()
        {
            //System.Windows.Forms.MessageBox.Show("Download Complete ... ");

            // Create guid/uuid
            string uuid = Guid.NewGuid().ToString();
            string status = webBrowser.ReadyState.ToString();
            string div = "<div class=\"navigateComplete\">After Donwload Complete create uuid, " + uuid + ", Status: "+ status +"</div>";
            document.body.insertAdjacentHTML("afterBegin", div);
        }

        #region BHO Internal Functions
        public static string BHOKEYNAME = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Browser Helper Objects";

        [ComRegisterFunction]
        public static void RegisterBHO(Type type)
        {
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME, true);

            if (registryKey == null)
                registryKey = Registry.LocalMachine.CreateSubKey(BHOKEYNAME);

            string guid = type.GUID.ToString("B");
            RegistryKey ourKey = registryKey.OpenSubKey(guid);

            if (ourKey == null)
                ourKey = registryKey.CreateSubKey(guid);

            ourKey.SetValue("Alright", 1);
            registryKey.Close();
            ourKey.Close();
        }

        [ComUnregisterFunction]
        public static void UnregisterBHO(Type type)
        {
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME, true);
            string guid = type.GUID.ToString("B");

            if (registryKey != null)
                registryKey.DeleteSubKey(guid, false);
        }

        public int SetSite(object site)
        {
            if (site != null)
            {
                webBrowser = (WebBrowser)site;
                webBrowser.DocumentComplete += new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                //webBrowser.NavigateComplete2 += new DWebBrowserEvents2_NavigateComplete2EventHandler(this.OnNavigateComplete2);
                //webBrowser.BeforeNavigate2 += new DWebBrowserEvents2_BeforeNavigate2EventHandler(this.OnBeforeNavigate2);
                //webBrowser.DownloadComplete += new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
            }
            else
            {
                webBrowser.DocumentComplete -= new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                //webBrowser.NavigateComplete2 -= new DWebBrowserEvents2_NavigateComplete2EventHandler(this.OnNavigateComplete2);
                //webBrowser.BeforeNavigate2 -= new DWebBrowserEvents2_BeforeNavigate2EventHandler(this.OnBeforeNavigate2);
                //webBrowser.DownloadComplete -= new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
                webBrowser = null;
            }

            return 0;

        }

        public int GetSite(ref Guid guid, out IntPtr ppvSite)
        {
            IntPtr punk = Marshal.GetIUnknownForObject(webBrowser);
            int hr = Marshal.QueryInterface(punk, ref guid, out ppvSite);
            Marshal.Release(punk);

            return hr;
        }

        #endregion

    }
}
