using System.Collections;
using System.IO;
using UnityEngine;
using WebGLFileUploader;

#if UNITY_5_3 || UNITY_5_3_OR_NEWER
using UnityEngine.SceneManagement;
#endif
using OpenCVForUnity;

namespace WebGLFileUploaderExample
{
    /// <summary>
    /// Texture2D to mat example.
    /// </summary>
    public class Texture2DToMatExample : MonoBehaviour
    {
        // Use this for initialization
        void Start ()
        {
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
            WebGLFileUploadManager.SetAllowedFileName("\\.(png|jpe?g|gif)$");
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

                    Texture2D imgTexture = new Texture2D (2, 2);
                    byte[] byteArray = File.ReadAllBytes (file.filePath);
                    imgTexture.LoadImage (byteArray);

                    Debug.Log("File.ReadAllBytes:byte[].Length: " + byteArray.Length);

                    Mat imgMat = new Mat (imgTexture.height, imgTexture.width, CvType.CV_8UC4);
                    Utils.texture2DToMat (imgTexture, imgMat);

                    Debug.Log ("imgMat.ToString() " + imgMat.ToString ());

                    Texture2D texture = new Texture2D (imgMat.cols (), imgMat.rows (), TextureFormat.RGBA32, false);
                    Utils.matToTexture2D (imgMat, texture);
                    gameObject.GetComponent<Renderer> ().material.mainTexture = texture;

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
    }
}
