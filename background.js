
const TOKEN = ''
const chat_id = ''
var devmode = true;
var mt = {};
mt.rc = {};

function G(a) {
    if (devmode) {
        console.log(a);
    };
};
G('MT -> ON');
G('DevMode -> ' + devmode);

chrome.contextMenus.create({
    title: "Download to storage",
    contexts: ["all"],
    onclick: function(info, tab) {
        let url = tab.url;
        if(info.selectionText) {
            var selectionText = info.selectionText.toLowerCase().trim();        
            console.log(url);
            download_content(url,selectionText)
        } else {
            download_content(url)
        }
    }
});

function download_content(url,selectionText='') {
    var shortcode = url.split("/")[4];
    console.log(shortcode);
    var base_url = "https://www.instagram.com/graphql/query/?query_hash=621547c3e1f204de9f478384f5b3e674&variables=%7B%22shortcode%22%3A%22" + shortcode + "%22%7D";
    console.log(base_url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", base_url, true);
    var resp;
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            resp = JSON.parse(xhr.response).data.shortcode_media;
            var mediatype = resp.__typename;
            console.log(mediatype);
            var media_urls = [];
            var media_id;
            if (mediatype === "GraphVideo") {
                media_urls.push(resp.video_url);
                media_id = resp.id;
                chrome.downloads.download({
                    url: resp.video_url,
                    filename: "Storage/" + resp.id + "/" + resp.id + ".path" // Optional
                });
                downloadFile({
                    filename: "Storage/" + resp.id + "/" + resp.id + ".path",
                    content: resp.edge_media_to_caption.edges[0].node.text
                  });
            } else if (mediatype === "GraphImage") {
                media_urls.push(resp.display_url);
                media_id = resp.id;
                chrome.downloads.download({
                    url: resp.display_url,
                    filename: "Storage/" + resp.id + "/" + resp.id + ".path" // Optional
                });
                downloadFile({
                    filename: "Storage/" + resp.id + "/" + resp.id + ".path",
                    content: resp.edge_media_to_caption.edges[0].node.text
                  });
            } else {
                var album = resp.edge_sidecar_to_children.edges;
                media_id = resp.id;
                console.log(media_id);
                for (var i = 0; i < album.length; i++) {
                    if (album[i].node.__typename == "GraphVideo") {
                        media_urls.push(album[i].node.video_url);
                        chrome.downloads.download({
                            url: album[i].node.video_url,
                            filename: "Storage/" + resp.id +"/"+ resp.id + i + ".path" // Optional
                        });
                    } else {
                        media_urls.push(album[i].node.display_url);
                        chrome.downloads.download({
                            url: album[i].node.display_url,
                            filename: "Storage/" + resp.id +"/"+ resp.id + i + ".path" // Optional
                        });
                    }
                }
                downloadFile({
                    filename: "Storage/" + resp.id + "/" + resp.id + ".path",
                    content: resp.edge_media_to_caption.edges[0].node.text
                  });
            }
        }
    }
    xhr.send();
}

function downloadFile(options) {
    if(!options.url) {
        var blob = new Blob([ options.content ], {type : "text/plain;charset=UTF-8"});
        options.url = window.URL.createObjectURL(blob);
    }
    chrome.downloads.download({
        url: options.url,
        filename: options.filename
    })
}
