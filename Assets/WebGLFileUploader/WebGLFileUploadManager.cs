using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using System.Runtime.InteropServices;

namespace WebGLFileUploader
{
    /// <summary>
    /// WebGL File Uploader.
    /// v 1.0.3
    /// Usage:
    /// Select a dedicated template ([FileUploader5.3-5.5] or [FileUploader5.6-2017]) in the Player Settings inspector (menu: Edit > Project Settings > Player).
    /// </summary>
    public static class WebGLFileUploadManager
    {
        /// <summary>
        /// Occurs when on file uploaded.
        /// </summary>
        public static event Action<UploadedFileInfo[]> onFileUploaded;

        /// <summary>
        /// Shows the file upload UI.
        /// </summary>
        /// <returns><c>true</c>, if file upload UI was showd, <c>false</c> otherwise.</returns>
        /// <param name="isDropInput">If set to <c>true</c> is drop input.</param>
        /// <param name="isOverlay">If set to <c>true</c> is overlay.</param>
        /// <param name="x">The x coordinate.</param>
        /// <param name="y">The y coordinate.</param>
        /// <param name="width">Width.</param>
        /// <param name="height">Height.</param>
        public static bool Show (bool isDropInput = false, bool isOverlay = false, int x = -1, int y = -1, int width = -1, int height = -1)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            bool success = WebGLFileUploadManager.Unity_FileUploadManager_Show(isDropInput, isOverlay, x, y, width, height);
            WebGLFileUploadManager.Unity_FileUploadManager_SetCallback (WebGLFileUploadManager.Callback);
            return success;
            #else
            return false;
            #endif
        }

        /// <summary>
        /// Popup the file upload dialog UI.
        /// </summary>
        /// <returns><c>true</c>, if dialog was popuped, <c>false</c> otherwise.</returns>
        /// <param name="titleText">Title text.</param>
        /// <param name="uploadBtnText">Upload button text.</param>
        /// <param name="cancelBtnText">Cancel button text.</param>
        public static bool PopupDialog (string titleText = "", string uploadBtnText = "", string cancelBtnText = "")
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            if (Screen.fullScreen)
            {
                if( Unity_FileUploadManager_IsRunningOnEdgeBrowser() ){
                    Screen.fullScreen = false;
                }else{
                    Unity_FileUploadManager_HideUnityScreenIfHtmlOverlayCant();
                }
            }
            bool success = WebGLFileUploadManager.Unity_FileUploadManager_PopupDialog(titleText, uploadBtnText, cancelBtnText);
            WebGLFileUploadManager.Unity_FileUploadManager_SetCallback (WebGLFileUploadManager.Callback);
            return success;
            #else
            return false;
            #endif
        }

        /// <summary>
        /// Hides the file upload UI.
        /// </summary>
        public static void Hide ()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_Hide ();
            #endif
        }

        public static void Dispose ()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_Dispose();
            #endif
        }

        public static void Enable ()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_Enable ();
            #endif
        }
        
        public static void Disable ()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_Disable();
            #endif
        }

        public static void SetDescription (string description)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_SetDescription (description);
            #endif
        }

        public static void SetAllowedFileName (string filenameReg)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_SetAllowedFileName (filenameReg);
            #endif
        }
        public static void SetImageEncodeSetting (bool enable, int threshold = -1)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_SetImageEncodeSetting (enable, threshold);
            #endif
        }

        public static void SetImageShrinkingSize (int width = 640, int height = 480)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_SetImageShrinkingSize (width, height);
            #endif
        }

        public static bool IsDropInput {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return WebGLFileUploadManager.Unity_FileUploadManager_IsDropInput ();
                #else
                return false;
                #endif
            }
        }

        public static bool IsOverlay {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return WebGLFileUploadManager.Unity_FileUploadManager_IsOverlay ();
                #else
                return false;
                #endif
            }
        }
 
        public static bool IsPopupDialog {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return WebGLFileUploadManager.Unity_FileUploadManager_IsPopupDialog ();
                #else
                return false;
                #endif
            }
        }
            
        public static void SetDebug (bool value)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            WebGLFileUploadManager.Unity_FileUploadManager_SetDebug (value);
            #endif
        }

        public static OS_NAME getOS {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                string osName = Unity_FileUploadManager_GetOS();
                OS_NAME platform;

                switch (osName) {
                case "iOS":
                platform = OS_NAME.iOS;
                break;
                case "Mac":
                platform = OS_NAME.Mac;
                break;
                case "Android":
                platform = OS_NAME.Android;
                break;
                case "Windows":
                platform = OS_NAME.Windows;
                break;
                case "Chrome OS":
                platform = OS_NAME.ChromeOS;
                break;
                case "FireFox OS":
                platform = OS_NAME.FireFoxOS;
                break;
                default:
                platform = OS_NAME.UNKNOWN;
                break;
                }
                return platform;
                #else
                return OS_NAME.UNKNOWN;
                #endif
            }
        }

        public static bool  IsMOBILE {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return Unity_FileUploadManager_IsMobile();
                #else
                return false;
                #endif
            }
        }

        public static bool  IsIOS {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.iOS);
                #else
                return false;
                #endif
            }
        }

        public static bool  IsMac {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.Mac);
                #else
                return false;
                #endif
            }
        }

        public static bool  IsAndroid {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.Android);
                #else
                return false;
                #endif
            }
        }

        public static bool  IsWindows {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.Windows);
                #else
                return false;
                #endif
            }
        }

        public static bool  IsChromeOS {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.ChromeOS);
                #else
                return false;
                #endif
            }
        }

        public static bool  IsFireFoxOS {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return (getOS == OS_NAME.FireFoxOS);
                #else
                return false;
                #endif
            }
        }

        public static string  GetUserAgent
        {
            get {
                #if UNITY_WEBGL && !UNITY_EDITOR
                return Unity_FileUploadManager_GetUserAgent();
                #else
                return "";
                #endif
            }
        }
            
        #if UNITY_WEBGL && !UNITY_EDITOR

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_Show (bool isDropInput, bool isOverlay, int x, int y, int width, int height);

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_PopupDialog (string title, string uploadBtnText, string cancelBtnText);

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_Hide ();

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_Dispose ();

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_Enable ();

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_Disable ();

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetCallback (Action<string> callback);

        [AOT.MonoPInvokeCallback (typeof(Action<string>))]
        private static void Callback (string fileUploadDataJSON)
        {
            Debug.Log ("Callback called " + fileUploadDataJSON);

            if(onFileUploaded == null) {
                Debug.Log ("onFileUploaded == null");
                return;
            }

            UploadedFileInfo[] files;
            if (!string.IsNullOrEmpty(fileUploadDataJSON)) {
                files = JsonUtility.FromJson<FileUploadResult>(fileUploadDataJSON).files;
                onFileUploaded.Invoke (files);
            } else {
                files = new UploadedFileInfo[0]{};
                onFileUploaded.Invoke (files);
            }
                
            //Debug.Log (onFileUploaded);
        }

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetDescription (string str);

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetAllowedFileName (string str);

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetImageShrinkingSize (int width, int height);

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetImageEncodeSetting (bool enable, int threshold);

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_IsDropInput ();

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_IsOverlay ();

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_IsPopupDialog ();

        [DllImport ("__Internal")]
        private static extern void Unity_FileUploadManager_SetDebug (bool value);

        [DllImport ("__Internal")]
        private static extern string Unity_FileUploadManager_GetOS ();

        [DllImport ("__Internal")]
        private static extern bool Unity_FileUploadManager_IsMobile ();

        [DllImport ("__Internal")]
        private static extern string Unity_FileUploadManager_GetUserAgent ();

        [DllImport("__Internal")]
        private static extern void Unity_FileUploadManager_HideUnityScreenIfHtmlOverlayCant();

        [DllImport("__Internal")]
        private static extern bool Unity_FileUploadManager_IsRunningOnEdgeBrowser();
        #endif

        [Serializable]
        class FileUploadResult
        {
            public UploadedFileInfo[] files = new UploadedFileInfo[] {};
        }
    }

    [Serializable]
    public class UploadedFileInfo
    {
        public string name = "";
        public string type = "";
        public int size = 0;
        public int lastModified = 0;
        public string filePath = "";
        public bool isSuccess = false;
        public int errorCode = 0;
    }

    public enum ERROR_CODE :int
    {
        NONE = 0,
        NOT_FOUND_ERR = 1,
        SECURITY_ERR = 2,
        ABORT_ERR = 3,
        NOT_READABLE_ERRF = 4,
        ENCODING_ERR = 5,
        FS_IO_ERRO = 6,
        NOT_ALLOWED_FILENAME = 7
    }

    public enum OS_NAME {iOS, Mac, Android, Windows, ChromeOS, FireFoxOS, UNKNOWN};
}
