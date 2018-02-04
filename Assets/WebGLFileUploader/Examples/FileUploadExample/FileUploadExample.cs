using System.Collections;
using System.IO;
using UnityEngine;
using WebGLFileUploader;

#if UNITY_5_3 || UNITY_5_3_OR_NEWER
using UnityEngine.SceneManagement;
#endif

namespace WebGLFileUploaderExample
{
    /// <summary>
    /// File Upload example.
    /// </summary>
    public class FileUploadExample : MonoBehaviour
    {
        // Use this for initialization
        void Start ()
        {
            Debug.Log("WebGLFileUploadManager.getOS: " + WebGLFileUploadManager.getOS);
            Debug.Log("WebGLFileUploadManager.isMOBILE: " + WebGLFileUploadManager.IsMOBILE);
            Debug.Log("WebGLFileUploadManager.getUserAgent: " + WebGLFileUploadManager.GetUserAgent);

            WebGLFileUploadManager.SetDebug(true);
            if ( 
                #if UNITY_WEBGL && !UNITY_EDITOR 
                    WebGLFileUploadManager.IsMOBILE 
                #else
                    Application.isMobilePlatform
                #endif
            ) {
                WebGLFileUploadManager.Show (false);
                WebGLFileUploadManager.SetDescription("Select image files (.png|.jpg|.gif)");

            }else{
                WebGLFileUploadManager.Show (true);
                WebGLFileUploadManager.SetDescription("Drop image files (.png|.jpg|.gif) here");
            }
            WebGLFileUploadManager.SetImageEncodeSetting(true);
            WebGLFileUploadManager.SetAllowedFileName("\\.(png|jpe?g|gif)$");
            WebGLFileUploadManager.SetImageShrinkingSize(1280 ,960);
            WebGLFileUploadManager.onFileUploaded += OnFileUploaded;
        }

        // Update is called once per frame
        void Update ()
        {

        }

        /// <summary>
        /// Raises the destroy event.
        /// </summary>
        void OnDestroy ()
        {
            WebGLFileUploadManager.onFileUploaded -= OnFileUploaded;
            WebGLFileUploadManager.Dispose();
        }

        /// <summary>
        /// Raises the file uploaded event.
        /// </summary>
        /// <param name="result">Uploaded file infos.</param>
        private void OnFileUploaded(UploadedFileInfo[] result)
        {
            if(result.Length == 0) {
                Debug.Log("File upload Error!");
            }else{
                Debug.Log("File upload success! (result.Length: " + result.Length + ")");
            }

            foreach(UploadedFileInfo file in result){
                if(file.isSuccess){
                    Debug.Log("file.filePath: " + file.filePath + " exists:" + File.Exists(file.filePath));

                    Texture2D texture = new Texture2D (2, 2);
                    byte[] byteArray = File.ReadAllBytes (file.filePath);
                    texture.LoadImage (byteArray);
                    gameObject.GetComponent<Renderer> ().material.mainTexture = texture;

                    Debug.Log("File.ReadAllBytes:byte[].Length: " + byteArray.Length);

                    break;
                }
            }
        }

        /// <summary>
        /// Raises the back button click event.
        /// </summary>
        public void OnBackButtonClick ()
        {
            #if UNITY_5_3 || UNITY_5_3_OR_NEWER
            SceneManager.LoadScene ("WebGLFileUploaderExample");
            #else
            Application.LoadLevel ("WebGLFileUploaderExample");
            #endif
        }

        /// <summary>
        /// Raises the switch button overlay state button click event.
        /// </summary>
        public void OnSwitchButtonOverlayStateButtonClick ()
        {
            WebGLFileUploadManager.Show(false, !WebGLFileUploadManager.IsOverlay);
        }

        /// <summary>
        /// Raises the switch drop overlay state button click event.
        /// </summary>
        public void OnSwitchDropOverlayStateButtonClick ()
        {
            WebGLFileUploadManager.Show(true, !WebGLFileUploadManager.IsOverlay);
        }

        /// <summary>
        /// Raises the popup dialog button click event.
        /// </summary>
        public void OnPopupDialogButtonClick ()
        {
            WebGLFileUploadManager.PopupDialog(null, "Select image files (.png|.jpg|.gif)");
        }

        /// <summary>
        /// Raises the enable button click event.
        /// </summary>
        public void OnEnableButtonClick ()
        {
            WebGLFileUploadManager.Enable ();
        }

        /// <summary>
        /// Raises the disable button click event.
        /// </summary>
        public void OnDisableButtonClick ()
        {
            WebGLFileUploadManager.Disable ();
        }
    }
}
