using System;
using SHDocVw;
using mshtml;
using Microsoft.Win32;
using System.Runtime.InteropServices;
using System.IO;

namespace CouponDigger
{
    [
    ComVisible(true),
    Guid("95531B9A-D1C5-4874-A3EE-7819EC33B461"),
    ClassInterface(ClassInterfaceType.None)
    ]
    public class BHO : IObjectWithSite
    {
        WebBrowser webBrowser;
        HTMLDocument document;
        private const string GUID = "95531B9A-D1C5-4874-A3EE-7819EC33B461";
        private const string CUR_VERSION = "1.0.2013.6073";
        private const string JS_URL = "https://i.couponmountain.com/coupon_digger.js";
        private static string curUserId = "";

        private void OnDocumentComplete(object pDisp, ref object URL)
        {
            document = (HTMLDocument)webBrowser.Document;
            string _reqUrl = URL as string;
            string siteUrl = webBrowser.LocationURL as string;

            if (_reqUrl != siteUrl || siteUrl.IndexOf("http") != 0)
            {
                return;
            }
            string jsVar = "var cmus_uuid='"+ this.GetUserId() +"', cmus_version='"+ CUR_VERSION +"';";

            this.InjectJSText(jsVar);
            this.InjectJS(JS_URL);
        }

        /***************************   Get uuid from txt file   ************************************
        private const string UUID_FILE = "C:\\Program Files\\CouponDigger\\uid.txt";
        private string GetUserId()
        {
            if (String.IsNullOrEmpty(curUserId))
            {
                curUserId = Guid.NewGuid().ToString();
                try
                {
                    curUserId = this.GetTxtUuid();
                }
                catch (Exception)
                {
                    curUserId = Guid.NewGuid().ToString();
                }
            }

            return curUserId;
        }

        public string GetTxtUuid()
        {
            string uuid = "";
            if (System.IO.File.Exists(UUID_FILE))
            {
                StreamReader srReadFile = new StreamReader(UUID_FILE);
                uuid = srReadFile.ReadLine();
                srReadFile.Close();
            }
            else
            {
                this.InjectLog("Uuid txt file doesnt exist, file: " + UUID_FILE);
                uuid = this.WriteTxtUuid();
            }
            return uuid;
        }

        public string WriteTxtUuid()
        {
            string uuid = Guid.NewGuid().ToString();
            try
            {
                StreamWriter swWriteFile = File.CreateText(UUID_FILE);
                swWriteFile.WriteLine(uuid);
                swWriteFile.Close();
            }
            catch (Exception e)
            {
                this.InjectLog("Write uuid to txt file failure!! " + e.ToString());
            }
            return uuid;
        }
        ***************************   End get uuid from txt file   ************************************/


        private string GetUserId()
        {
            if (String.IsNullOrEmpty(curUserId))
            {
                curUserId = Guid.NewGuid().ToString();
                /*try
                {
                    RegistryKey masterKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME + "\\{" + GUID + "}");
                    if (masterKey != null)
                    {
                        curUserId = masterKey.GetValue("uuid", "").ToString();
                        masterKey.Close();
                        if (String.IsNullOrEmpty(curUserId))
                        {
                            curUserId = this.RegUserId();
                        }
                    }
                }
                catch (Exception)
                {
                    curUserId = this.RegUserId();
                }*/
            }

            return curUserId;
        }

        private string RegUserId()
        {
            //string uuid;
            string uuid = Guid.NewGuid().ToString();
            try
            {
                RegistryKey subKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME + "\\{" + GUID + "}", true);
                if (subKey != null)
                {
                    subKey.SetValue("uuid", uuid);
                    subKey.Close();
                }
            }
            catch (Exception e)
            {
                this.InjectLog("Registry error info: "+ e.ToString());
            }
            return uuid;
        }

        #region inject/alert
        private void InjectLog(string logStr)
        {
            if (document == null) return;
            string divStr = "<div class=\"cmus_log\">" + logStr + "</div>";
            document.body.insertAdjacentHTML("afterBegin", divStr);
        }

        private void InjectHtml(string showText)
        {
            if (document == null) return;
            string url = "http://localhost/plugin/ie.php?v=" + CUR_VERSION + "&uid=" + GetUserId();
            string injectHtml = "";
            injectHtml = "<div id=\"cmusTest\" style=\"position: fixed; bottom: 5px; text-align: center; width: 100%; background-color: #000; color: #fff; height: 30px; line-height: 30px;\">"
                          + showText + "</div>";

            //injectHtml = "<div id=\"cmusBlock\"><iframe src=\""+ url +"\"></iframe></div>";

            document.body.insertAdjacentHTML("afterBegin", injectHtml);
        }

        private void InjectJS(string jsUrl)
        {
            IHTMLElement head = (IHTMLElement)((IHTMLElementCollection)document.all.tags("head")).item(null, 0);
            IHTMLScriptElement scriptObject = (IHTMLScriptElement)document.createElement("script");
            scriptObject.type = @"text/javascript";
            scriptObject.src = jsUrl;
            
            ((HTMLHeadElement)head).appendChild((IHTMLDOMNode)scriptObject);
        }

        private void InjectJSText(string jsText)
        {
            IHTMLElement head = (IHTMLElement)((IHTMLElementCollection)document.all.tags("head")).item(null, 0);
            IHTMLScriptElement scriptObject = (IHTMLScriptElement)document.createElement("script");
            scriptObject.type = @"text/javascript";
            scriptObject.text = jsText;

            ((HTMLHeadElement)head).appendChild((IHTMLDOMNode)scriptObject);
        }

        private void InjectCSS(string cssUrl)
        {
            try
            {
                //IHTMLStyleSheet cssObject = (IHTMLStyleSheet)document.createStyleSheet("", 0);
                //cssObject.cssText = ".cmus{color:red;}"; // String containing CSS to inject into the page
            }
            catch (Exception e)
            {
                this.InjectLog(e.ToString());
            }
        }

        private void Alert(string msg)
        {
            System.Windows.Forms.MessageBox.Show(msg);
        }
        #endregion


        #region Set/Get Site object

        public int SetSite(object site)
        {
            if (site != null)
            {
                webBrowser = (WebBrowser)site;
                webBrowser.DocumentComplete += new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                //webBrowser.DownloadComplete += new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
            }
            else
            {
                webBrowser.DocumentComplete -= new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
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


        #region Regist/Unregist Key
        public static string BHOKEYNAME = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Browser Helper Objects";

        [ComRegisterFunction]
        public static void RegisterBHO(Type type)
        {
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME, true);

            if (registryKey == null)
            {
                registryKey = Registry.LocalMachine.CreateSubKey(BHOKEYNAME);
            }

            string guid = type.GUID.ToString("B");
            RegistryKey ourKey = registryKey.OpenSubKey(guid, true);

            if (ourKey == null)
            {
                ourKey = registryKey.CreateSubKey(guid);
            }

            //string userId = Guid.NewGuid().ToString();
            ourKey.SetValue("", "CouponDiggerBHO");
            ourKey.SetValue("NoExplorer", 1);
            ourKey.SetValue("Alright", 1);
            ourKey.SetValue("AlwaysCreate", true);
            //ourKey.SetValue("uuid", userId);
            registryKey.Close();
            ourKey.Close();
        }

        [ComUnregisterFunction]
        public static void UnregisterBHO(Type type)
        {
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(BHOKEYNAME, true);
            string guid = type.GUID.ToString("B");

            if (registryKey != null)
            {
                registryKey.DeleteSubKey(guid, false);
            }
        }

        #endregion
    }
}
