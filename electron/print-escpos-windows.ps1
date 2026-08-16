param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$DataPath
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class AndaRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOC_INFO_1
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string printerName, out IntPtr printer, IntPtr defaults);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr printer);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern int StartDocPrinter(IntPtr printer, int level, [In] DOC_INFO_1 documentInfo);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr printer);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr printer);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr printer);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr printer, IntPtr bytes, int count, out int written);

    private static void Check(bool success, string operation)
    {
        if (!success) throw new Win32Exception(Marshal.GetLastWin32Error(), operation);
    }

    public static void Send(string printerName, byte[] data)
    {
        IntPtr printer = IntPtr.Zero;
        IntPtr unmanaged = IntPtr.Zero;
        bool documentStarted = false;
        bool pageStarted = false;
        try
        {
            Check(OpenPrinter(printerName, out printer, IntPtr.Zero), "Printer tidak dapat dibuka");
            var info = new DOC_INFO_1 { pDocName = "Anda POS Receipt", pDataType = "RAW" };
            if (StartDocPrinter(printer, 1, info) == 0)
                throw new Win32Exception(Marshal.GetLastWin32Error(), "Job RAW tidak dapat dimulai");
            documentStarted = true;
            Check(StartPagePrinter(printer), "Halaman RAW tidak dapat dimulai");
            pageStarted = true;
            unmanaged = Marshal.AllocCoTaskMem(data.Length);
            Marshal.Copy(data, 0, unmanaged, data.Length);
            int written;
            Check(WritePrinter(printer, unmanaged, data.Length, out written), "Data ESC/POS gagal dikirim");
            if (written != data.Length) throw new InvalidOperationException("Data ESC/POS tidak terkirim seluruhnya.");
        }
        finally
        {
            if (unmanaged != IntPtr.Zero) Marshal.FreeCoTaskMem(unmanaged);
            if (pageStarted) EndPagePrinter(printer);
            if (documentStarted) EndDocPrinter(printer);
            if (printer != IntPtr.Zero) ClosePrinter(printer);
        }
    }
}
'@

if (-not (Test-Path -LiteralPath $DataPath)) { throw "Data struk tidak ditemukan: $DataPath" }
$data = [System.IO.File]::ReadAllBytes($DataPath)
if ($data.Length -eq 0) { throw 'Data struk kosong.' }
[AndaRawPrinter]::Send($PrinterName, $data)
