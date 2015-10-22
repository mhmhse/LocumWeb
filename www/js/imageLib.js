var imageLib = {

    //## Recursive version - downloads URLs one at a time (to solve issue with ashx handlers and concurrent requests)
    downloadImages: function(urls, onCompletion) {
        if(urls.length == 0) {
            appLib.log('Completed image downloads');
            onCompletion();
            return;
        }
    
        var url = _.first(urls);
        var otherUrls = _.rest(urls);
        
        appLib.log('requesting image ' + url);
            
        var counter = urls.length;
        var filename = 'image' + counter + '.png';
            
        appLib.downloadFile(url,
                            filename,
                            function(url, file) {
                                window.localStorage.setItem('oeImage' + url, file);
                                appLib.log('success: ' + file + ' is ' + url);
                            
                                imageLib.downloadImages(otherUrls, onCompletion);
                            },
                            function() {
                                appLib.log('image download failed');
                            
                                imageLib.downloadImages(otherUrls, onCompletion);
                            }
        );
        
    },


    getImage: function (url, fallbackToOnlineVersion) {
        var file = window.localStorage.getItem('oeImage' + url);

        //## Ensure image file data is available locally
        if (file == null)
            if (!fallbackToOnlineVersion) {
                appLib.log('Null image for ' + url);
                return '';
            } else {
                appLib.log('Using online ' + url);
                return url;
            }

        appLib.log('Using local ' + url);
        return file;
    },


    //## Returns base64 uri for the specified image
    getDataUri: function (imageEl) {
        var canvas = window.document.createElement("canvas");
        canvas.width = imageEl.width;
        canvas.height = imageEl.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(imageEl, 0, 0);

        var dataUri = null;

        try {
            dataUri = canvas.toDataURL();
            appLib.log('Successfully read ' + imageEl.src);
        } catch (e) {
            dataUri = null;
            appLib.log('Error reading ' + imageEl.src);
        }

        return dataUri;
    },


    //## Clears all images from local storage
    clearLocalImages: function () {
        var keys = [];

        //## Find the keys of images in local storage
        for (var i = 0; i < window.localStorage.length; i++) {
            if (window.localStorage.key(i).substr(0, 7) == 'oeImage')
                keys.push(window.localStorage.key(i));
        }

        //## Remove images from local storage
        _.each(keys, function (key) {
            window.localStorage.removeItem(key);
        });
    },


    //## Returns image elements in the specified HTML
    findImages: function (inputHtml) {
        var html = $('<html>').html(inputHtml);

        return $('img', html);
    },


    //## Runs [processFunc] for each image in the specified HTML, before returning the processed HTML
    processImages: function (inputHtml, processFunc) {
        var html = $('<div />').append(inputHtml);
        $('img', html).each(function (index, el) {
            processFunc($(el, html));
        });

        return html.html();
    }
};