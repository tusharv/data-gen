const CAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SML = CAP.toLowerCase();
const NUM = "1234567890";
const MAX_ROW_PER_FILE = 1000000;
var Pool = "";
var zip;

$(document).ready(function(){
    console.log("Ready");

    $('#fileName').val(generateFileName());

    $( "#datagenerator" ).submit(function( event ) {
        $('#result').html("");

        zip = new JSZip();

        let isCap = $('#chkCap').is(":checked");
        let isSml = $('#chkSml').is(":checked");
        let isNum = $('#chkNum').is(":checked");
        let min = Number($('#sizeMin').val());
        let max = Number($('#sizeMax').val());

        //Swaping Min Max Cheaply
        if(min > max){
            var temp = min;
            min = max;
            max = temp;
        }
    
        Pool = ((isCap) ? CAP : '') + ((isSml) ? SML : '') + ((isNum) ? NUM : '') + $('#custom').val();

        let total = Number($('#maxSize').val());
        let totalPerFile = Number($('#maxSizeperFile').val());
        let fileName = $('#fileName').val() + '.csv';

        //Should have used Promise here
        if(totalPerFile !== total){
            file_id = 1;
            $('.overlay').height('100%');
            setTimeout(()=>{
                do{
                    generateData(Math.min(totalPerFile,total), min, max, fileName.replace(".csv","_"+file_id+".csv"));
                    total -= totalPerFile;
                    file_id++;
                }while(total>0);
                setTimeout(()=>{
                    $('.overlay').height('0');
                    generateZip(fileName);
                },100);
            },600)
        }else{
            generateData(total, min, max, fileName);
        }
        
        return false;
    });

    $('button[type="reset"]').on('click', function(){
        $('#result').html("");
        $('.progress').addClass('d-none');
        $('.progress-bar').width('0%');
        setTimeout(()=>{
            $('#fileName').val(generateFileName());
        },10);
    });

    $('#maxSize').on('keypress', function(){
        setTimeout(()=>{
            $('#maxSizeperFile').val(($('#maxSize').val() > MAX_ROW_PER_FILE)?MAX_ROW_PER_FILE:$('#maxSize').val());
        },10)
    });

    $('.update-size').on('keypress', function(){
        setTimeout(()=>{
            displayFileSize();
        },10)
    });
});

function displayFileSize(){
    try{
        let total = Number($('#maxSize').val());
        let totalPerFile = Number($('#maxSizeperFile').val());
        let min = Number($('#sizeMin').val());
        let max = Number($('#sizeMax').val()) || min;
        let fileMin = (totalPerFile * min);
        let fileMax = (totalPerFile * max); 
        let files = Math.round(total/totalPerFile);
        $('.fileSizeEstimation').html("Output fill will be between <kbd>" + roundDigit(fileMin,2) + "</kbd> to <kbd>" +  roundDigit(fileMax,2) + "</kbd> per File of total " + files + " Files");
    }catch(e){
        $('.fileSizeEstimation').html("");
    }
}

function roundDigit(num, decimal=2) {
    let unit = "";
    let decplaces = Math.pow(10, decimal);

    if(num < (1024 * .75)){
        unit = " Bytes";
    }else if(num < (1048576 * .75)){
        num = num/1024;
        unit = " KB";
    }else{
        num = num/1048576;
        unit = " MB";
    }
    return (Math.round(num * decplaces) / decplaces) + unit;
}

async function generateData(total, min, max, fileName){
    let csvContent = "";
    let len = Pool.length;
    let starttime = new Date();
    
    $('.progress').removeClass('d-none');

    for(let i = 0 ; i < total ; i++){
        let size = getRandomNumberBetween(min,max);
        var name = "";
        for(let j = 0; j < size; j++){
            name = name.concat(Pool.substr(getRandomNumberBetween(0,len-1),1));
        }
        csvContent = csvContent.concat(name,"\r\n");

        $('.progress-bar').width(Math.round(i/total)*100 + '%');
    }

    csvData = new Blob([csvContent], { type: 'text/csv' }); 
    zip.file(fileName, csvData);
    let csvUrl = URL.createObjectURL(csvData);
    let link = document.createElement("a");
    
    $(link).attr("href", csvUrl).attr("download",fileName).addClass("box").html("<p>"+fileName+" (" + roundDigit(csvData.size, 2) + ")</p>");
    $('#result').append(link);

    let endtime = new Date();
    console.log("Process with "+total+" data took", endtime - starttime);

    setTimeout(()=>{
        $('.progress').addClass('d-none');
        $('.progress-bar').width('0%');
    }, 5000);
}

function getRandomNumberBetween(min, max){
    let size = Math.round(Math.random() * (max-min) + min);
    size = Math.max(size,min);
    size = Math.min(size,max);
    return size;
}

function generateFileName(){
    var d = new Date();
    return `Data_${d.getDate()}_${d.getMonth()+1}_${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

function generateZip(fileName){
    let linkZip = document.createElement("a");
        zip.generateAsync({type:"blob"})
        .then(function(content)
        {
            let linkZip = document.createElement("a");
            $(linkZip).attr("href", URL.createObjectURL(content)).attr("download",fileName.replace(".csv",".zip")).addClass("box zip").html("<p>"+fileName.replace(".csv",".zip")+"</p>");
            $('#result').append(linkZip);
        });
}