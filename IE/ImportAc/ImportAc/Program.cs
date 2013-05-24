using System;
using System.Text;
using System.Security.Cryptography.X509Certificates;

namespace ImportAc
{
    class Program
    {
        private const string CRT_FILE = @"C:\Program Files\ValueClick Brands, Inc\Coupon Digger\server.crt";

        static void Main(string[] args)
        {
            X509Certificate2 certificate2;
            bool isImport = true;

            Console.WriteLine("Start import CRT file...");

            // Test crt file is exist or not
            if (!System.IO.File.Exists(CRT_FILE))
            {
                isImport = false;
                Console.WriteLine("CRT file doesnt exist !!! ");
                Console.Read();
                return;
            }

            // Execute import
            try
            {
                certificate2 = new X509Certificate2(CRT_FILE);
                X509Store store = new X509Store(StoreName.Root, StoreLocation.CurrentUser);
                store.Open(OpenFlags.ReadWrite);
                store.Add(certificate2);
                store.Close();
            }
            catch (Exception)
            {
                isImport = false;
                Console.WriteLine("Import CRT file Occur an error !!");
                Console.WriteLine("Error information: Opration is cancel by user... \r\nPlease try again and click [yes] to permit import CRT file, thanks.");
                Console.WriteLine("Notice: ^-^ Close IE before install ^-^ ");
                //Console.WriteLine("Error information: " + Es.ToString());
            }

            // Console import result
            if (isImport)
            {
                Console.WriteLine("Import CRT file success.");
            }
            else
            {
                Console.WriteLine("Import CRT file failure.");
                Console.Read();
            }
        }
    }
}
