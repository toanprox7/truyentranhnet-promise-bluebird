var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var folder = __dirname +'/Comics';
var im = require('imagemagick');
function getLink(url,partern,isImages) {
    return new Promise(function (resolve,reject) {
        request(url,function (err,res,body) {
            var links =[];
            if (res.statusCode == 200){
                var $ = cheerio.load(body);
                $(partern).map(function (val,key) {
                    if (isImages == 'imga'){
                        return links.push($(this).attr('src'));
                    } else if (isImages == 'href') {
                        return links.push($(this).attr('href'));
                    }else if (isImages =='hrefChapter'){
                        return links.push($(this).attr('href'));
                    }

                })
            }else{
                reject([]);
            }
            // console.log(links);
            if(isImages == 'imga')
                resolve(links);
            else if (isImages == 'href'){
                resolve(links[1]);
            }else if (isImages == 'hrefChapter'){
                resolve(links);
            }
        })
    })
}

function getComic(url) {
    getLink(url,'.hot-manga .thumbnails a','href')
        .then(function (commicUrl) {
            if (commicUrl.length) {
                return getLink(commicUrl, '.total-chapter #examples p a', 'hrefChapter')
            }else{
                console.log('khong tim thay truyen');
            }
        })
        .then(function (chapterUrl) {
            // console.log(chapterUrl.length);
            let getLinkArray = [];
             if (chapterUrl.length){
                // Promise.all(chapterUrl).then(function (links) {
                //
                // }).then(function (linksChap2) {
                //     console.log(linksChap2);
                // })linksChap2
                 chapterUrl.map(function (url_) {
                     getLinkArray.push(getLink(url_,'.each-page img','imga'));
                 });
                return Promise.all(getLinkArray);
             }else{
                 throw new Error('Khong tim thay url');
             }
        })
        .then(function (imagesUrl) {
            if (imagesUrl.length > 0) {
                function nameOfComic() {
                    let arrComic = imagesUrl[0][0].split('-');
                    let indexChap = arrComic.indexOf('Chap');
                    let valueLast = arrComic.pop();
                    let addLast = arrComic.push(valueLast);
                    let indexLast = arrComic.indexOf(valueLast);
                    let totalIndex = (indexLast - indexChap) + 1;
                    let removeArr = arrComic.splice(indexChap, totalIndex);
                    let removeArr2 = arrComic.splice(0, 2);
                    let nameOfComic = arrComic.join("_");
                    return nameOfComic;
                }

                // nameOfComic();
                // console.log(imagesUrl);
                // function chapter(){
                for (i = 0; i <= imagesUrl.length; i++) {
                    if (imagesUrl[i][0] == undefined) {
                        continue;
                    }

                    var arrChapter = imagesUrl[i][0].split(" ");
                    arrChapter.forEach(function (linkChap) {
                        let arrChapter = linkChap.split("-");
                        let indexChap1 = arrChapter.indexOf('Chap');
                        let indexChap2 = arrChapter.indexOf('Hamtruyenvn');
                        let valueLast = arrChapter.pop();
                        let addLast = arrChapter.push(valueLast);
                        let indexLast = arrChapter.indexOf(valueLast);
                        let totalIndex = (indexLast - indexChap2) + 1;
                        let removeArr = arrChapter.splice(indexChap2, totalIndex);
                        let removeArr2 = arrChapter.splice(0, 2);
                        let chapter = arrChapter.join("_");
                        //check and create folder if not exists


                        if (!fs.existsSync(folder))fs.mkdirSync(folder);
                        if (!fs.existsSync(folder+nameOfComic()))fs.mkdirSync(folder+nameOfComic());
                        if (!fs.existsSync(folder+nameOfComic()+'/'+chapter))fs.mkdirSync(folder+nameOfComic()+'/'+chapter);
                        imagesUrl[i].map(function (url, val) {
                            let ext;
                            let filename = path.basename(url);
                            if (filename.match(/.jpg/ig)) ext = 'jpg';
                            if (filename.match(/.png/ig)) ext = 'png';
                            filename = folder+nameOfComic()+'/'+chapter+'/' + val+'.'+ext;
                            console.log(filename);
                            // let chapterName = folder+nameOfComic+'/'+chapter;
                            // check file
                            fs.exists(filename, function (exists) {
                                if (!exists){
                                    console.log('Downloading...');
                                    request({
                                            url : url + '?fit=crop&fm='+ext+'&q=50&w=400' ,
                                            encoding: 'binary'}
                                        , function (err,response,body) {
                                            if(err) {
                                                console.log(err)
                                            } else {
                                                fs.writeFile(filename ,body,'binary', function (err) {
                                                    if(err) {
                                                        console.log(err);
                                                    }
                                                })
                                            }
                                        })
                                }else if (exists) {
                                    console.log('existed...');
                                    if (!fs.existsSync(folder+nameOfComic()+'/'+chapter+'/'+'anhNho')) fs.mkdirSync(folder+nameOfComic()+'/'+chapter+'/'+'anhNho');
                                    let fileImageSmall = folder+nameOfComic()+'/'+chapter+'/'+'anhNho'+'/'+val+'-small'+'.'+ext;
                                    if (!fs.existsSync(fileImageSmall)){
                                        im.resize({
                                            srcPath:filename,
                                            dstPath:fileImageSmall,
                                            width:600,
                                            height:400
                                        }, function (err,stdout,stderr) {
                                            if (err) throw err
                                            console.log('thanh cong');
                                        })
                                    } else{
                                        console.log('khong co anh nho');
                                    }

                                }
                            });
                        })
                    })

                }
            // }
            //     chapter();

                // console.log(imagesUrl);

            } else{
                console.log('khong tim thay anh nao ca');
            }
        })
        .catch(function (err) {
            console.log(err.message);
        })
}

getComic('http://truyentranh.net');