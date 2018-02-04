var LibraryFileUploadManager = {

    $Unity_FileUploadManager: {
        detectOS:function(ua) {
            switch (true) {
            case /Android/.test(ua): return "Android";
            case /iPhone|iPad|iPod/.test(ua): return "iOS";
            case /Windows/.test(ua): return "Windows";
            case /Mac OS X/.test(ua): return "Mac";
            case /CrOS/.test(ua): return "Chrome OS";
            case /Firefox/.test(ua): return "Firefox OS";
            }
            return "";
        },
        
        resample_hermite:function (img, W, H, W2, H2){
            var canvas = document.createElement('canvas');
            canvas.width = W2;
            canvas.height = H2;
            var ctx = canvas.getContext('2d');
            var img2 = ctx.createImageData(W2, H2);
            var data = img.data;
            var data2 = img2.data;
            var ratio_w = W / W2;
            var ratio_h = H / H2;
            var ratio_w_half = Math.ceil(ratio_w/2);
            var ratio_h_half = Math.ceil(ratio_h/2);
            for(var j = 0; j < H2; j++){
                for(var i = 0; i < W2; i++){
                    var x2 = (i + j*W2) * 4;
                    var weight = 0;
                    var weights = 0;
                    var gx_r = 0, gx_g = 0,  gx_b = 0, gx_a = 0;
                    var center_y = (j + 0.5) * ratio_h;
                    for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
                        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                        var center_x = (i + 0.5) * ratio_w;
                        var w0 = dy*dy;
                        for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
                            var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                            var w = Math.sqrt(w0 + dx*dx);
                            if(w >= -1 && w <= 1){
                                weight = 2 * w*w*w - 3*w*w + 1;
                                if(weight > 0){
                                    dx = 4*(xx + yy*W);
                                    gx_r += weight * data[dx];
                                    gx_g += weight * data[dx + 1];
                                    gx_b += weight * data[dx + 2];
                                    gx_a += weight * data[dx + 3];
                                    weights += weight;
                                }
                            }
                        }
                    }
                    data2[x2]         = gx_r / weights;
                    data2[x2 + 1] = gx_g / weights;
                    data2[x2 + 2] = gx_b / weights;
                    data2[x2 + 3] = gx_a / weights;
                }
            }
            ctx.putImageData(img2, 0, 0);
            return canvas;
        },
        getOrientation:function (imgDataURL){
            var byteString = atob(imgDataURL.split(',')[1]);
            var orientaion = byteStringToOrientation(byteString);
            return orientaion;

            function byteStringToOrientation(img){
                var head = 0;
                var orientation;
                while (1){
                    if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 218) {break;}
                    if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 216) {
                        head += 2;
                    }
                    else {
                        var length = img.charCodeAt(head + 2) * 256 + img.charCodeAt(head + 3);
                        var endPoint = head + length + 2;
                        if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 225) {
                            var segment = img.slice(head, endPoint);
                            var bigEndian = segment.charCodeAt(10) == 77;
                            if (bigEndian) {
                                var count = segment.charCodeAt(18) * 256 + segment.charCodeAt(19);
                            } else {
                                var count = segment.charCodeAt(18) + segment.charCodeAt(19) * 256;
                            }
                            for (var i=0;i<count;i++){
                                var field = segment.slice(20 + 12 * i, 32 + 12 * i);
                                if ((bigEndian && field.charCodeAt(1) == 18) || (!bigEndian && field.charCodeAt(0) == 18)) {
                                    orientation = bigEndian ? field.charCodeAt(9) : field.charCodeAt(8);
                                }
                            }
                            break;
                        }
                        head = endPoint;
                    }
                    if (head > img.length){break;}
                }
                return orientation;
            }
        },
        detectSubsampling:function (img) {
            var iw = img.naturalWidth, ih = img.naturalHeight;
            if (iw * ih > 1024 * 1024) {
                var canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, -iw + 1, 0);
                return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
            } else {
                return false;
            }
        },
        detectVerticalSquash:function (img, iw, ih) {
            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = ih;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, 1, ih).data;
            var sy = 0;
            var ey = ih;
            var py = ih;
            while (py > sy) {
                var alpha = data[(py - 1) * 4 + 3];
                if (alpha === 0) {
                    ey = py;
                } else {
                    sy = py;
                }
                py = (ey + sy) >> 1;
            }
            var ratio = (py / ih);
            return (ratio===0)?1:ratio;
        },
        transformCoordinate:function (canvas, width, height, orientation) {
            if (orientation > 4) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }
            var ctx = canvas.getContext('2d');
            switch (orientation) {
                case 2:
                    // horizontal flip
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                    break;
                case 3:
                    // 180 rotate left
                    ctx.translate(width, height);
                    ctx.rotate(Math.PI);
                    break;
                case 4:
                    // vertical flip
                    ctx.translate(0, height);
                    ctx.scale(1, -1);
                    break;
                case 5:
                    // vertical flip + 90 rotate right
                    ctx.rotate(0.5 * Math.PI);
                    ctx.scale(1, -1);
                    break;
                case 6:
                    // 90 rotate right
                    ctx.rotate(0.5 * Math.PI);
                    ctx.translate(0, -height);
                    break;
                case 7:
                    // horizontal flip + 90 rotate right
                    ctx.rotate(0.5 * Math.PI);
                    ctx.translate(width, -height);
                    ctx.scale(-1, 1);
                    break;
                case 8:
                    // 90 rotate left
                    ctx.rotate(-0.5 * Math.PI);
                    ctx.translate(-width, 0);
                    break;
                default:
                    break;
            }
        },
        dataURLtoArrayBuffer:function (dataurl) {
            var bin = atob(dataurl.split("base64,")[1]);
            var len = bin.length;
            var barr = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                barr[i] = bin.charCodeAt(i);
            }
            return barr.buffer;
        },
        
        isInitialized:false,
        isDebug:false,
        isDropInput:false,
        isOverlay:false,
        isPopupDialog:false,
        enableImageEncoding:true,
        imageEncodingThreshold:0,
        imageShrinkingSizeWidth:640,
        imageShrinkingSizeHeight:480,
        jsCallCsCallback:null,
        filenameRegStr:".*",
        descriptionStr:null,
        popupDialogCompleteFunc:null,
        ERROR_CODE:{
            NONE : 0,
            NOT_FOUND_ERR : 1,
            SECURITY_ERR : 2,
            ABORT_ERR : 3,
            NOT_READABLE_ERRF : 4,
            ENCODING_ERR : 5,
            IMG_LOAD_ERR : 6,
            FS_IO_ERR : 7,
            NOT_ALLOWED_FILENAME : 8,
            
        },
        initialize: function () {
            Unity_FileUploadManager.createRequiredHTML();
            Unity_FileUploadManager.isInitialized = true;

            return Unity_FileUploadManager.isInitialized;
        },
        hide: function () {
            if (!Unity_FileUploadManager.isInitialized) return;

            var fileUploaderElem = document.getElementById('file_uploader');

            if (Unity_FileUploadManager.isOverlay) {
                fileUploaderElem.style.removeProperty("width");
                fileUploaderElem.style.removeProperty("height");
                fileUploaderElem.classList.remove('overlay_canvas');
            }

            var dropAreaElem = document.getElementById('file_drop_area');
            if (dropAreaElem != null && Unity_FileUploadManager.isDropInput) {
                // Remove the dnd listeners.
                dropAreaElem.removeEventListener('dragover', Unity_FileUploadManager.handleDragOver, false);
                dropAreaElem.removeEventListener('drop', Unity_FileUploadManager.handleFileSelect, false);
                dropAreaElem.removeEventListener('dragenter', Unity_FileUploadManager.handleDragEnter, false);
                dropAreaElem.removeEventListener('dragleave', Unity_FileUploadManager.handleDragLeave, false);

                fileUploaderElem.innerHTML = '';
                fileUploaderElem.classList.remove('isDropInput');
            }

            var fileInputElem = document.getElementById('file_input');
            if (fileInputElem != null && (!Unity_FileUploadManager.isDropInput || Unity_FileUploadManager.isPopupDialog)) {
                // Remove the input listeners.
                fileInputElem.removeEventListener('change', Unity_FileUploadManager.handleFileSelect, false);

                fileUploaderElem.innerHTML = '';
                fileUploaderElem.classList.remove('isButtonInput');
            }
            fileUploaderElem.classList.add('hidden');

            if (!Unity_FileUploadManager.isPopupDialog) {
                var fileListElem = document.getElementById('file_uploader_file_list');
                fileListElem.innerHTML = '';
                fileListElem.classList.add('hidden');
            }

            if (Unity_FileUploadManager.isPopupDialog) {
                Unity_FileUploadManager.popupDialogCompleteFunc = null;
                document.getElementById("popup_dialog_warp").style.display = "none";
                document.getElementById('popup_dialog_warp').innerHTML = '';
            }


            Unity_FileUploadManager.jsCallCsCallback = null;

            Unity_FileUploadManager.isDropInput = false;
            Unity_FileUploadManager.isOverlay = false;
            Unity_FileUploadManager.isPopupDialog = false;
        },
        enable: function () {
            if (Unity_FileUploadManager.isPopupDialog) return;

            if(Unity_FileUploadManager.isDropInput){
                var fileDropArea = document.getElementById('file_drop_area');
                if (fileDropArea != null) fileDropArea.classList.remove('disable');
            }else{
                var fileInputButton = document.getElementById('file_input_button');
                if (fileInputButton != null) fileInputButton.classList.remove('disable');
            }
        },
        disable: function () {
            if (Unity_FileUploadManager.isPopupDialog) return;

            if (Unity_FileUploadManager.isDropInput) {
                var fileDropArea = document.getElementById('file_drop_area');
                if (fileDropArea != null) fileDropArea.classList.add('disable');
            } else {
                var fileInputButton = document.getElementById('file_input_button');
                if (fileInputButton != null) fileInputButton.classList.add('disable');
            }
        },
        checkExistAPI:function() {
            return (!window.File || !window.FileReader || !window.Promise) ? false : true;
        },
        createRequiredHTML:function() {
            var fileUploaderElem = document.getElementById('file_uploader');
            if(fileUploaderElem == null){
                var canvas = document.getElementById('canvas') || document.getElementById('gameContainer');
                var fileUploaderElem = document.createElement('div');
                fileUploaderElem.id = 'file_uploader';
                canvas.parentNode.insertBefore(fileUploaderElem, canvas.nextSibling); 
            }
            
            var fileListElem = document.getElementById('file_uploader_file_list');
            if(fileListElem == null){
                var fileUploaderElem = document.getElementById('file_uploader');
                var fileListElem = document.createElement('div');
                fileListElem.id = 'file_uploader_file_list';
                fileUploaderElem.parentNode.insertBefore(fileListElem, fileUploaderElem.nextSibling); 
            }
        },
        handleFileSelect:function (evt) {
            var files; // FileList object.
            if(Unity_FileUploadManager.isDropInput){
                evt.stopPropagation();
                evt.preventDefault();
                files = evt.dataTransfer.files;
                document.getElementById('file_drop_area').classList.remove('onDragOver');
            }else{
                files = evt.target.files;
            }
                
            document.getElementById('file_uploader_file_list').innerHTML = '';
            
            var dirpathStr = "fileuploader";
            var filenameReg = new RegExp(Unity_FileUploadManager.filenameRegStr, 'i');
            var imageFileTypeReg = new RegExp("image\/(png|jpeg|gif)$", 'i');
            
            
            // create data directory.
            try {
                var stat = FS.stat('/' + dirpathStr);
            } catch (e) {
                FS.mkdir('/' + dirpathStr);
            }
            
            
            function readImageFile(result) {  
                return new Promise(function(resolve, reject) {
            
                    //if(Unity_FileUploadManager.isDebug) console.log("readImageFile: " + result.file.name);
                    
                    var maxWidth = Unity_FileUploadManager.imageShrinkingSizeWidth;
                    var maxHeight = Unity_FileUploadManager.imageShrinkingSizeHeight;
                    var file = result.file;
                    if (!file.type.match(/^image\/(png|jpeg|gif)$/)) return;
                    var img = new Image();
                    var reader = new FileReader();

                    reader.onload = function(e) {
                        var data = e.target.result;

                        img.onload = function() {

                            var iw = img.naturalWidth, ih = img.naturalHeight;
                            var width = iw, height = ih;

                            var orientation;

                            // In the case of JPEG, obtain Orientation (rotation) information from EXIF.
                            if (data.split(',')[0].match('jpeg')) {
                                orientation = Unity_FileUploadManager.getOrientation(data);
                            }
                            // If it is not JPEG or EXIF ​​is not JPEG, set it to the standard value.
                            orientation = orientation || 1;

                            // For example, rotate 90 degrees, if the aspect ratio changes, change the maximum width and height beforehand.
                            if (orientation > 4) {
                                var tmpMaxWidth = maxWidth;
                                maxWidth = maxHeight;
                                maxHeight = tmpMaxWidth;
                            }

                            if(width > maxWidth || height > maxHeight) {
                                var ratio = width/maxWidth;
                                if(ratio <= height/maxHeight) {
                                    ratio = height/maxHeight;
                                }
                                width = Math.floor(img.width/ratio);
                                height = Math.floor(img.height/ratio);
                            }

                            var canvas = document.createElement('canvas');
                            var ctx = canvas.getContext('2d');
                            ctx.save();

                            // Rotate Canvas from EXIF's Orientation information.
                            Unity_FileUploadManager.transformCoordinate(canvas, width, height, orientation);

                            // Avoid iPhone subsampling problems.
                            var subsampled = Unity_FileUploadManager.detectSubsampling(img);
                            if (subsampled) {
                                iw /= 2;
                                ih /= 2;
                            }
                            var d = 1024; // size of tiling canvas
                            var tmpCanvas = document.createElement('canvas');
                            tmpCanvas.width = tmpCanvas.height = d;
                            var tmpCtx = tmpCanvas.getContext('2d');
                            var vertSquashRatio = Unity_FileUploadManager.detectVerticalSquash(img, iw, ih);
                            var dw = Math.ceil(d * width / iw);
                            var dh = Math.ceil(d * height / ih / vertSquashRatio);
                            var sy = 0;
                            var dy = 0;
                            while (sy < ih) {
                                var sx = 0;
                                var dx = 0;
                                while (sx < iw) {
                                    tmpCtx.clearRect(0, 0, d, d);
                                    tmpCtx.drawImage(img, -sx, -sy);
                                    var imageData = tmpCtx.getImageData(0, 0, d, d);
                                    var resampled = Unity_FileUploadManager.resample_hermite(imageData, d, d, dw, dh);
                                    ctx.drawImage(resampled, 0, 0, dw, dh, dx, dy, dw, dh);
                                    sx += d;
                                    dx += dw;
                                }
                                sy += d;
                                dy += dh;
                            }
                            ctx.restore();
                            tmpCanvas = tmpCtx = null;

                            //display new Image.
                            var displaySrc = ctx.canvas.toDataURL('image/jpeg', .9);
                            
                            /*
                            var displayImg = document.createElement('img');
                            displayImg.id = 'preview';
                            displayImg.setAttribute('src', displaySrc);
                            displayImg.setAttribute('alt', file.name);
                            displayImg.setAttribute('style','max-width:90%;max-height:90%');
                            document.getElementById('file_uploader_file_list').appendChild(displayImg);
                            */
                            
                            // dataURL to ArrayBuffer.
                            result.buf = Unity_FileUploadManager.dataURLtoArrayBuffer(displaySrc);
                            result.name = result.file.name.match(/(.*)(?:\.([^.]+$))/)[1] + ".jpg";
                            result.size = result.buf.byteLength;
                            result.type = "image/jpeg";
                            
                            resolve(writeFileToFS(result));
                        }
                        img.onerror = function () {
                            result.errorCode = Unity_FileUploadManager.ERROR_CODE.IMG_LOAD_ERR;
                            resolve(result);
                        }
                        img.src = data;
                    }
                    reader.onerror = function (event) {   
                        result.errorCode = reader.error.code;//Unity_FileUploadManager.ERROR_CODE1～5
                        resolve(result);
                    }
                    reader.readAsDataURL(file);
                });
            }

            function readBinaryFile(result) {  
                return new Promise(function(resolve, reject) {
            
                    //if(Unity_FileUploadManager.isDebug) console.log("readBinaryFile: " + result.file.name);

                    var reader = new FileReader();   
                    reader.onload = function (event) {
                        result.buf = reader.result;
                        resolve(writeFileToFS(result));
                    }
                    reader.onerror = function (event) {
                        result.errorCode = reader.error.code;//Unity_FileUploadManager.ERROR_CODE1～5
                        resolve(result);
                    }
                
                    reader.readAsArrayBuffer(result.file);
                });
            }
            
            function writeFileToFS(result) {  
                return new Promise(function(resolve, reject) {
            
                    //if(Unity_FileUploadManager.isDebug) console.log("writeFileToFS: " + result.name);
                
                    try {
                        var filePath = '/' + dirpathStr + '/' + escape(result.name);
                        var u8Arr = new Uint8Array(result.buf);
                        var stream = FS.open(filePath, 'w+');
                        FS.write(stream, u8Arr, 0, u8Arr.length, 0);
                        FS.close(stream);
                        
                        delete result.buf;
                        delete u8arr;
                        
                        //debug 
                        //var stat = FS.stat(filePath);
                        //console.log(stat);
                        //
                        
                        result.filePath = filePath;
                        result.isSuccess = true;
                        resolve(result);
                    } catch (e) {
                        //if(Unity_FileUploadManager.isDebug) console.log("writeFileToFS: " + result.name + " " + e);
                        
                        result.errorCode = Unity_FileUploadManager.ERROR_CODE.FS_IO_ERR;
                        resolve(result);
                    }
                });
            }
    
            function callbackCS(results) {
            
                var returnStr;
                if(results != null){
                    var destFileArray = [];
                    var len = results.length;
                    for (var i=0; i<len; i++){
                        var result = results[i];
                        var file = result.file;
                        var o = {"name":result.name, "type":result.type, "size":result.size, "lastModified":file.lastModified, "filePath":result.filePath, "isSuccess":result.isSuccess, "errorCode":result.errorCode};
                        destFileArray.push(o);
                    }
                
                    var object = {"files":destFileArray};
                    var fileUploadDataJSON = JSON.stringify(object);
                
                    returnStr = fileUploadDataJSON;
                }else{
                    returnStr = "";
                }

                var size = lengthBytesUTF8(returnStr) + 1;
                var buffer = _malloc(size);
                stringToUTF8(returnStr, buffer, size);

                Runtime.dynCall('vi', Unity_FileUploadManager.jsCallCsCallback, [buffer]);
                _free(buffer);
            }


            Unity_FileUploadManager.disable();
            
            var results = [];
            for (var i = 0, f; f = files[i]; i++) {
                results.push({"file":f, "name":f.name, "size":f.size, "type":f.type, "buf":null, "filePath":"", "isSuccess":false, "errorCode":Unity_FileUploadManager.ERROR_CODE.NONE});
            }
            
            Promise.resolve()
                .then(function(){
                    return Promise.all(results.map(function(result){
                        return new Promise(function(resolve, reject){
                        
                            //Allowed file name?
                            if(filenameReg.test(result.file.name)){
                                //Image File?
                                if(Unity_FileUploadManager.enableImageEncoding && Unity_FileUploadManager.imageEncodingThreshold <= result.file.size && imageFileTypeReg.test(result.file.type)){
                                    resolve(readImageFile(result));
                                }else{
                                    resolve(readBinaryFile(result));
                                }
                            }else{
                            
                                result.errorCode = Unity_FileUploadManager.ERROR_CODE.NOT_ALLOWED_FILENAME;
                                resolve(result);
                            }
                            
                        })
                    }))
                })
                .then(function(results){
                
                    if(Unity_FileUploadManager.isDebug) Unity_FileUploadManager.outputFileList(results);
                    callbackCS(results);
                    Unity_FileUploadManager.enable();
                    if(Unity_FileUploadManager.popupDialogCompleteFunc != null) Unity_FileUploadManager.popupDialogCompleteFunc();
                })
                .catch(function(err) {
                    console.log(err);
                    
                    callbackCS(null);
                    Unity_FileUploadManager.enable();
                    if(Unity_FileUploadManager.popupDialogCompleteFunc != null) Unity_FileUploadManager.popupDialogCompleteFunc();
                });
                
        },
        handleDragOver:function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    
            document.getElementById('file_drop_area').classList.add('onDragOver');
        },
        handleDragEnter:function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },
        handleDragLeave:function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            document.getElementById('file_drop_area').classList.remove('onDragOver');
        },
        outputFileList: function (results) { 
        
            var output = [];
            var len = results.length;
            for (var i=0; i<len; i++){
                var result = results[i];
                var f = result.file;
                
                output.push('<li' , (result.isSuccess)?'':' style="color: #bbb"' , '>', escape(result.name), ' (', result.type || 'n/a', ') - ',
                        result.size, ' bytes, last modified: ',
                        f.lastModified, (result.isSuccess) ? ' filePath=' : ' errorCode=', (result.isSuccess) ? result.filePath : result.errorCode,'</li>');
            
                console.log("result" + i + ": " + f.name + " " + f.size + " " + f.type + " " + f.lastModified + " / " + result.name + " " + result.size + " " + result.type + " " + result.isSuccess + " " + result.filePath + " " + result.errorCode);
            }
            document.getElementById('file_uploader_file_list').innerHTML += "<ul>" + output.join('') + "</ul>";
        }
    },
    Unity_FileUploadManager_Show: function (isDropInput, isOverlay, x, y, width, height)
    {
        if (Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Show()");

        Unity_FileUploadManager.hide();
        
        Unity_FileUploadManager.isDropInput = isDropInput;
        Unity_FileUploadManager.isOverlay = isOverlay;


        if(!Unity_FileUploadManager.checkExistAPI()) {
            console.log("Does not exist API necessary.");
            return false;
        }

        if (!Unity_FileUploadManager.isInitialized) Unity_FileUploadManager.initialize();
        var fileUploaderElem = document.getElementById('file_uploader');
        var fileListElem = document.getElementById('file_uploader_file_list');

            
            if(Unity_FileUploadManager.isDropInput){
                Unity_FileUploadManager.descriptionStr = "Drop files here";
            
                fileUploaderElem.innerHTML = '<div id="file_drop_area">' + Unity_FileUploadManager.descriptionStr + '</div>';
                
                var dropAreaElem = document.getElementById('file_drop_area');
                // Setup the dnd listeners.
                dropAreaElem.addEventListener('dragover', Unity_FileUploadManager.handleDragOver, false);
                dropAreaElem.addEventListener('drop', Unity_FileUploadManager.handleFileSelect, false);
                dropAreaElem.addEventListener('dragenter', Unity_FileUploadManager.handleDragEnter, false);
                dropAreaElem.addEventListener('dragleave', Unity_FileUploadManager.handleDragLeave, false);
                
                fileUploaderElem.classList.add('isDropInput');
            }else{
                Unity_FileUploadManager.descriptionStr = "Select files";
                
                var html = '<label for="file_input" id="file_input_button">' + 
                           '    <div id="file_input_description">' + Unity_FileUploadManager.descriptionStr + '</div>' + 
                           '    <input type="file" id="file_input" name="files[]" style="display:none;" multiple />' +
                           '</label>';
                fileUploaderElem.innerHTML = html;
                
                // Setup the input listeners.
                document.getElementById('file_input').addEventListener('change', Unity_FileUploadManager.handleFileSelect, false);
                
                fileUploaderElem.classList.add('isButtonInput');
            }
            fileUploaderElem.classList.remove('hidden');
            
            fileListElem.innerHTML = '';
            if(Unity_FileUploadManager.isDebug) {
                fileListElem.classList.remove('hidden');
            }else{
                fileListElem.classList.add('hidden');
            }
            
            
            var canvasElem = document.getElementById('canvas') || document.getElementById('gameContainer');
            if(isOverlay){
        
                fileUploaderElem.style.setProperty("width", canvasElem.width + "px", "important");
                fileUploaderElem.style.setProperty("height", canvasElem.height + "px", "important");
            
                fileUploaderElem.classList.add('overlay_canvas');
            
                if(Unity_FileUploadManager.isDropInput){
                    var dropAreaElem = document.getElementById('file_drop_area');
                    dropAreaElem.classList.add('overlay');
                }else{
                    var inputButtonElem = document.getElementById('file_input_button');
                    inputButtonElem.classList.add('overlay');
                }
            }

            var targetElem;
            if (Unity_FileUploadManager.isDropInput) {
                targetElem = document.getElementById('file_drop_area');
            } else {
                targetElem = document.getElementById('file_input_button');
            }

            if (x < 0 || y < 0 || width < 0 || height < 0) {
                targetElem.style.top = '';
                targetElem.style.left = '';
                targetElem.style.width = '';
                targetElem.style.height = '';
                targetElem.style.lineHeight = '';
            } else {
                targetElem.style.top = x + 'px';
                targetElem.style.left = y + 'px';
                targetElem.style.width = width + 'px';
                targetElem.style.height = height + 'px';
                targetElem.style.lineHeight = height + 'px';
            }
            
            return Unity_FileUploadManager.isInitialized;
    },
    Unity_FileUploadManager_PopupDialog: function(titleText, uploadBtnText, cancelBtnText)
    {
        if (Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_PopupDialog()");

        Unity_FileUploadManager.hide();
    
        titleText = Pointer_stringify(titleText);
        uploadBtnText = Pointer_stringify(uploadBtnText);
        cancelBtnText = Pointer_stringify(cancelBtnText);
    
        Unity_FileUploadManager.isPopupDialog = true;
        
        if(!Unity_FileUploadManager.checkExistAPI()) {
            console.log("Does not exist API necessary.");
            return false;
        }

        if (!Unity_FileUploadManager.isInitialized) Unity_FileUploadManager.initialize();
        Unity_FileUploadManager.descriptionStr = "Select files";
            
            var html = '  <div id="popup_dialog">' + 
               '    <div id="popup_dialog_title">Here is title</div>' + 
               '    <div id="popup_dialog_file_input_button_warp">' + 
               '        <label for="file_input" id="popup_dialog_file_input_button">' + 
               '            <div id="file_input_description">Select files</div>' + 
               '            <input type="file" id="file_input" name="files[]" style="display:none;" multiple />' +
               '        </label>' +
               '    </div>' +
               '    <div id="popup_dialog_cancel_button_warp">' + 
               '      <input id="popup_dialog_cancel_button" type="button" value="Cancel">' + 
               '    </div>' + 
               '</div>';
            
            var popup_dialog_warpElem = document.getElementById('popup_dialog_warp');
            if(popup_dialog_warpElem == null){
                popup_dialog_warpElem = document.createElement('div');
                popup_dialog_warpElem.id = 'popup_dialog_warp';
                document.body.appendChild( popup_dialog_warpElem );
            }
            popup_dialog_warpElem.innerHTML = html;
            popup_dialog_warpElem.style.display = "";
            
            Unity_FileUploadManager.popupDialogCompleteFunc = function () {
                var canvasElem = document.getElementById('canvas') || document.getElementById('gameContainer');
                canvasElem.style.display = "";
                Unity_FileUploadManager.hide();
            };
            
            
            // Setup the input listeners.
            var fileInputElem = document.getElementById('file_input');
            fileInputElem.addEventListener('change', (function(e) {
                return function f(e) {
                    fileInputElem.removeEventListener('change', f, false);
                    document.getElementById("popup_dialog_file_input_button_warp").style.display = "none";
                    document.getElementById("popup_dialog_cancel_button_warp").style.display = "none";
                    document.getElementById("popup_dialog_title").innerHTML = 'Now Loading...';
                    Unity_FileUploadManager.handleFileSelect(e);
                }
            })(1), false);
            
            
            var cancelBtn = document.getElementById("popup_dialog_cancel_button");
            cancelBtn.addEventListener('click', (function(x) {
                return function f() {
                    cancelBtn.removeEventListener('click', f, false);
                    Unity_FileUploadManager.popupDialogCompleteFunc();
                }
            })(1), false);
            
            document.getElementById("popup_dialog_title").innerText = (titleText != '') ? titleText : 'File Uploader';
            document.getElementById("file_input_description").innerText = (uploadBtnText != '') ? uploadBtnText : Unity_FileUploadManager.descriptionStr;
            document.getElementById("popup_dialog_cancel_button").value = (cancelBtnText != '') ? cancelBtnText : 'Cancel';


            var fileListElem = document.getElementById('file_uploader_file_list');
            fileListElem.innerHTML = '';
            if (Unity_FileUploadManager.isDebug) {
                fileListElem.classList.remove('hidden');
            } else {
                fileListElem.classList.add('hidden');
            }
        
        return Unity_FileUploadManager.isInitialized;
    },
    Unity_FileUploadManager_HideUnityScreenIfHtmlOverlayCant: function(){
        if (navigator.userAgent.indexOf("Chrome/") < 0) {
            var canvasElem = document.getElementById('canvas') || document.getElementById('gameContainer');
            canvasElem.style.display = "none";
        }
    },
    Unity_FileUploadManager_IsRunningOnEdgeBrowser: function(){
        if( navigator.userAgent.indexOf("Edge/") < 0 ){
            return false;
        }
        return true;
    },
    Unity_FileUploadManager_Hide: function()
    {
        if (Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Hide()");

        Unity_FileUploadManager.hide();
    },
    Unity_FileUploadManager_Dispose: function () {
        if (Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Dispose()");

        Unity_FileUploadManager.hide();
        /*
        var fileUploaderElem = document.getElementById('file_uploader');
        if (fileUploaderElem != null) {
            var fileUploaderElem_parent = fileUploaderElem.parentNode;
            fileUploaderElem_parent.removeChild(fileUploaderElem);
        }

        var fileListElem = document.getElementById('file_uploader_file_list');
        if (fileListElem != null) {
            var fileListElem_parent = fileListElem.parentNode;
            fileListElem_parent.removeChild(fileListElem);
        }
        */
        Unity_FileUploadManager.isInitialized = false;
    },
    Unity_FileUploadManager_SetCallback: function(callback)
    {
        //console.log("Unity_FileUploadManager_SetCallback()");
        Unity_FileUploadManager.jsCallCsCallback = callback;
    },
    Unity_FileUploadManager_IsDropInput: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_IsDropInput()");
        return Unity_FileUploadManager.isDropInput;
    },
    Unity_FileUploadManager_IsOverlay: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_IsOverlay()");
        return Unity_FileUploadManager.isOverlay;
    },
    Unity_FileUploadManager_IsPopupDialog: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_IsPopupDialog()");
        return Unity_FileUploadManager.isPopupDialog;
    },
    Unity_FileUploadManager_SetDebug: function(value)
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_IsDebug()");
        Unity_FileUploadManager.isDebug = value;
        
        var fileListElem = document.getElementById('file_uploader_file_list');
        if(fileListElem != null){
            if(Unity_FileUploadManager.isDebug) {
                fileListElem.classList.remove('hidden');
            }else{
                fileListElem.classList.add('hidden');
            }
        }
    },
    Unity_FileUploadManager_SetDescription: function(descriptionStr)
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_SetDescription()");
        
        var descriptionStr = Pointer_stringify(descriptionStr);
        if(Unity_FileUploadManager.isDropInput){
            if(descriptionStr == "") descriptionStr = "Drop files here";
            var fileDropArea = document.getElementById('file_drop_area');
            if(fileDropArea) fileDropArea.textContent = descriptionStr;
        }else{
            if(descriptionStr == "") descriptionStr = "Select files";
            var fileInputDescripton = document.getElementById('file_input_description');
            if(fileInputDescripton) fileInputDescripton.innerHTML = descriptionStr;
        }
        Unity_FileUploadManager.descriptionStr = descriptionStr;
    },
    Unity_FileUploadManager_SetAllowedFileName: function(filenameRegStr)
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_SetAllowedFileName()");
        
        var filenameRegStr = Pointer_stringify(filenameRegStr);
        if(filenameRegStr == "") filenameRegStr = ".*";
        Unity_FileUploadManager.filenameRegStr = filenameRegStr;
    },
    Unity_FileUploadManager_SetImageEncodeSetting: function(enable, threshold)
    {
        Unity_FileUploadManager.enableImageEncoding = enable;
        if(threshold >= 0) Unity_FileUploadManager.imageEncodingThreshold = threshold;
    },
    Unity_FileUploadManager_SetImageShrinkingSize: function(width, height)
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_SetImageShrinkingSize()");
        
        Unity_FileUploadManager.imageShrinkingSizeWidth = width>0 ? width : 1;
        Unity_FileUploadManager.imageShrinkingSizeHeight = height>0 ? height : 1;
    },
    Unity_FileUploadManager_Enable: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Enable()");
        
        Unity_FileUploadManager.enable();
    },
    Unity_FileUploadManager_Disable: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Disable()");
        
        Unity_FileUploadManager.disable();
    },
    /*
    Unity_FileUploadManager_Click: function()
    {
        if(Unity_FileUploadManager.isDebug) console.log("Unity_FileUploadManager_Click()");
       
        if(!Unity_FileUploadManager.isDropInput){
            var fileInputElem = document.getElementById('file_input');
            
            console.log(fileInputElem);
            
            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false,
                false, false, false, 0, null);
            fileInputElem.dispatchEvent(e);
        }
        
        
        var foobarElem = document.getElementById('foobar');
        var e = document.createEvent("MouseEvents");
            e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false,
                false, false, false, 0, null);
        foobarElem.dispatchEvent(e);

    },
    */
    Unity_FileUploadManager_GetOS: function()
    {
        var returnStr = Unity_FileUploadManager.detectOS(navigator.userAgent);

        var size = lengthBytesUTF8(returnStr) + 1;
        var buffer = _malloc(size);
        stringToUTF8(returnStr, buffer, size);

        return buffer;
    },
    Unity_FileUploadManager_IsMobile: function()
    {
        var ua = navigator.userAgent;
        var os = Unity_FileUploadManager.detectOS(ua);
        return (/Android|iOS/.test(os) || /Windows Phone/.test(ua));
    },
    Unity_FileUploadManager_GetUserAgent: function()
    {
        var returnStr = navigator.userAgent;

        var size = lengthBytesUTF8(returnStr) + 1;
        var buffer = _malloc(size);
        stringToUTF8(returnStr, buffer, size);

        return buffer;
    }
};
autoAddDeps(LibraryFileUploadManager, '$Unity_FileUploadManager');

mergeInto(LibraryManager.library, LibraryFileUploadManager);
