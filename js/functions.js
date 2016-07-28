var win=nw.Window.get();
var gui=require('nw.gui');
var fs=require("fs");
var exec=require("child_process").exec;
var execSync=require("child_process").execSync;
var spawn=require("child_process").spawn;
var elevate=require('node-windows').elevate;
var fileGet=require('resolve');
var http = require('http');
var fs = require('fs');
var runningVersion=require('./package.json').version;

win.on('focus', function() {
   $("body").removeClass("blur");
});

win.on('blur', function() {
   $("body").addClass("blur");
});

win.on('close', function() {
  win.hide(); // Pretend to be closed already
  localStorage.screenleft=win.x;
  localStorage.screentop=win.y;
  win.close(true);
});

win.on('loaded', function() {
  win.setShowInTaskbar(true);
  gui.Screen.Init();
  var screens = gui.Screen.screens;
  var locationIsOnAScreen = false;
  for (var i = 0; i < screens.length; i++) {
    var screen = screens[i];
    if (localStorage.screenleft > screen.bounds.x && localStorage.screenleft < screen.bounds.x + screen.bounds.width) {
      if (localStorage.screentop > screen.bounds.y && localStorage.screentop < screen.bounds.y + screen.bounds.height) {
        locationIsOnAScreen = true;
      }
    }
  }
  if (locationIsOnAScreen==true) {
    win.moveTo(parseInt(localStorage.screenleft), parseInt(localStorage.screentop));
  } else {
    win.moveTo(20,20);
  }
  win.show();
});

function createTray() {
  var tray = new nw.Tray({ title: 'WorkPlace Launcher', icon: 'images/rocket_icon.png' });
  var menu = new nw.Menu();
  menu.append(new nw.MenuItem({ label: 'Show',click: function() {
    win.show();
  } }));
  menu.append(new nw.MenuItem({ label: 'Exit',click: function() {
    win.close();
  } }));
  menu.append(new nw.MenuItem({ label: 'Version Check',click: function() {
    checkWPLVersion();
  } }));
  tray.menu = menu;
}

function closeTray() {
  nw.tray.remove();
  tray=null;
}

function checkWPLVersion() {
  try {
    $url = 'http://support.cochranetechservices.com/api/selfservice/article/9/';
    var curVer="";
    var JSONresponse=$.ajax({
      url: $url,
      type: 'GET',
      async: 'false',
      datatype: 'json',
      success: function() { 
        console.log("Success");
        var results = $.parseJSON( JSONresponse.responseText );
        $.each(results.data, function(k,v) { if (k=="keywords") { curVer=v; } });
        console.log((runningVersion<curVer));
        if (runningVersion<curVer) {
          openPopup("center","normal","Newer verison of WorkPlace Launcher!\nDownload it <a target='_blank' href='http://support.cochranetechservices.com/downloads/article/workplace-launcher'>here</a>!","OK",false);
        }
      },
      error: function() { console.log('Failed!'); },
      headers: { "Authorization": "Basic " + btoa('iZDsWTsGyo8u2CQ7e4Pd8yK&cehfqR+S' + ":" + 'x') },    
    });
    
  } catch(e) { console.log("Failed to check version!"); }
}

function checkAddOns() {
  console.log("checking...");
  $url = 'http://support.cochranetechservices.com/api/selfservice/article?tag_id=3';
  var JSONresponse=$.ajax({
    url: $url,
    type: 'GET',
    async: 'false',
    datatype: 'json',
    success: function() { 
      console.log("Success");
      var results = $.parseJSON( JSONresponse.responseText );
      $.each(results.data, function(k,v) { 
        console.log(v.title);
        console.log(v.attachments[0].download_url);
        console.log("attempting download...");
        var file = fs.createWriteStream('C:/temp/' + v.attachments[0].original_name);
        try {
          var request = http.get(v.attachments[0].download_url, function (response) {
              response.pipe(file);
          });
        } catch(e) { console.log(e); }
      });
    },
    error: function() { console.log('Failed!'); },
    headers: { "Authorization": "Basic " + btoa('iZDsWTsGyo8u2CQ7e4Pd8yK&cehfqR+S' + ":" + 'x') },    
  });
}

function resetWPL() {
  localStorage.firstuse = "yes";
  checkSettingsFile();
  closeAllMenus();
  loadVersions();
}

function checkSettingsFile() {
  if (localStorage.firstuse=="yes") { 
    localStorage.firstuse="no"; 
    localStorage.wpfolder=""; 
    localStorage.lastused="";
    localStorage.screenleft= "104"; 
    localStorage.screentop="104"; 
    localStorage.icon="";
    localStorage.lang="fr|French,en|English,de|German,es|Spanish"; 
    localStorage.deflang="en";
    localStorage.defthemeAX="";
    localStorage.defthemeN4="";
    localStorage.defthemesAX="";
    localStorage.defthemesN4="";
    localStorage.usethemes="true";
    localStorage.usetray="false";
    localStorage.useAutoSync="false";
    localStorage.navTreeData="";
    localStorage.navTreeMaster="";
    localStorage.navTreeN4Master="";
    localStorage.navTreeN4Ver="";
    localStorage.navTreeVer="";
    localStorage.usepopups="true";
  }
}

function closeAllMenus() {
  $(".menu-dropdown, .menu-dropdown-hide").removeClass("hide").addClass("hide");
}

function closePopup() {
    $('.popup-container').addClass('hide');
}

$('body').on('click', '.popup-cancel', closePopup);

//text alignment = "left" or "center"
//text size = "normal" or "small"
//message = string
//okay = text for what you want the okay button to say
//cancel = text for what you want the cancel button to say, or,
//         false if you don't want a cancel button
//callback = callback function to run when they click okay, doesn't have to be defined
function openPopup(align, size, message, okay, cancel, callback) {
    $('.popup-content').removeClass('normal small').addClass(size);
    $('.popup-text').removeClass('left center normal small').addClass(align).addClass(size).html(message);
    
    if (cancel == false) {
        $('.popup-cancel').removeClass('super-hide').addClass('super-hide');
    }
    else {
        $('.popup-cancel').removeClass('super-hide').text(cancel);
    }
    
    $('.popup-okay').text(okay);
    if (typeof callback !== "undefined") {
        $('.popup-okay').off().on('click', function() {
            closePopup();
            callback();
        });
    }
    else {
        $('.popup-okay').off().on('click', closePopup);
    }
    
    $('.popup-container').removeClass('hide');
}

function toggleSettings() {
  if ($(".settings-container").hasClass("hide")==true) {
    $('.settings-container .settings-content').scrollTop(0);
    $(".settings-container").removeClass("hide");
    win.resizeTo(500,300);
  } else {
    $(".settings-container").addClass("hide");
    win.resizeTo(500,300);
  }
}

function toggleMemory() {
  if ($(".memory-container").hasClass("hide")==true) {
    $('.memory-container .memory-content').scrollTop(0);
    $(".memory-container").removeClass("hide");
    win.resizeTo(500,300);
  } else {
    $(".memory-container").addClass("hide");
    win.resizeTo(500,300);
  }
}

function toggleAbout() {
  if ($(".about-container").hasClass("hide")==true) {
    $(".about-container").removeClass("hide");
  } else {
    $(".about-container").addClass("hide");
  }
}

function loadVersions() {
  var folders=localStorage.wpfolder;
  var lastused=localStorage.lastused;
  $("#dropdown").html("<select class='version placeholder'><option value='' disabled selected>Add a Niagara folder to get started</option></select>");
    if (folders=="") {
    var folder="";
    $("#theme").html("<select class='selected-theme' data-version='' disabled></select>");
    $("#theme").hide(0); 
  } else if (folders.indexOf(",")>0) {
    var folder=folders.split(",");
    folder.sort();
  } else {
    var folder=[folders];
  }
  var options=""; var add=false; var newOptGroup=""; var AXSyncOptions=""; var N4SyncOptions=""; var AXMasterFound=false; var N4MasterFound=false;
  for (var i=0; i<folder.length; i++) {
    try {
      var parentFolder=String(folder[i]);
      var subFolders=String(fs.readdirSync(parentFolder));
      var subFolder=subFolders.split(",");
      for (var j=0; j<subFolder.length; j++) {
        if (j==0) {
          newOptGroup=newOptGroup + "<optgroup label='" + parentFolder.replace("C:\\","") + "'>";
        }
        try {
          var exists=fs.statSync(parentFolder + '\\' + subFolder[j] + '\\bin\\wb.exe');
          if (exists.isFile()) {
            add=true;
            if ((parentFolder + '\\' + subFolder[j])==lastused) { var selected=" selected"; } else { var selected=""; }
            if (checkArch(parentFolder + '\\' + subFolder[j])=="32") {
              var Arch="32-bit";
            } else {
              var Arch="64-bit";
            }
            try {
              //console.log("AX Check.");
              //--- AX ---
              var exists=fs.statSync(parentFolder + '\\' + subFolder[j] + "\\lib\\brand.properties").toString().split("\n");
              var verType="AX";
              if (localStorage.navTreeMaster==subFolder[j]) { var AXSyncSelected=" selected"; AXMasterFound=true; } else { var AXSyncSelected=""; }
              AXSyncOptions=AXSyncOptions+"<option value='" + parentFolder + '\\' + subFolder[j] + "' label='" + subFolder[j] + " (" + Arch + ")'" + AXSyncSelected + " data-folder='" + subFolder[j] + "' data-arch='" + verType + "'>Niagara</option>";
            } catch(e) { 
              try {
                //console.log("AX Check Failed.. N4 Check.");
                //--- N4 ---
                var exists=fs.statSync(parentFolder + '\\' + subFolder[j] + "\\etc\\brand.properties").toString().split("\n");
                var verType="N4";
                if (localStorage.navTreeN4Master==subFolder[j]) { var N4SyncSelected=" selected"; N4MasterFound=true; } else { var N4SyncSelected=""; }
                N4SyncOptions=N4SyncOptions+"<option value='" + parentFolder + '\\' + subFolder[j] + "' label='" + subFolder[j] + " (" + Arch + ")'" + N4SyncSelected + " data-folder='" + subFolder[j] + "' data-arch='" + verType + "'>Niagara</option>";
              } catch(e) { 
                //console.log("N4 Check Failed."); 
              }
            }
            newOptGroup=newOptGroup + "<option value='" + parentFolder + '\\' + subFolder[j] + "' label='" + subFolder[j] + " (" + Arch + ")'" + selected + " data-folder='" + subFolder[j] + "' data-arch='" + verType + "'>Niagara</option>";
          }
        } catch(e) { }
        if (j==(subFolder.length-1)) {
          newOptGroup=newOptGroup + "</optgroup>";
          if (add==true) {
            options=options + newOptGroup;
            add=false;
          }
          newOptGroup="";
          if (i==(folder.length-1)) {
            if (AXMasterFound==false) { var AXNoMaster="<option disabled selected>No master selected</option>"; } else { var AXNoMaster=""; }
            if (N4MasterFound==false) { var N4NoMaster="<option disabled selected>No master selected</option>"; } else { var N4NoMaster=""; }
            $(".AX-Master").html("<select id='settings-ax-master'>" + AXNoMaster + AXSyncOptions + "</select>");
            $(".N4-Master").html("<select id='settings-n4-master'>" + N4NoMaster + N4SyncOptions + "</select>");
            $("#dropdown").html("<select class='versions form-control' title='Selected Niagara Workplace Version'>" + options + "</select>");
          }
        }
      }
      checkThemes();
      checkHostID();
    } catch (e) { }
  }
}

function checkArch(path) {
  var arch="64";
  try {
    var array = fs.readFileSync(path + "\\bin\\nreVersion.xml").toString().split("\n");
    for(i in array) {
      if (array[i].indexOf("nre-core-win-x86")>="0") { arch="32"; }
    }
  } catch(e) { }
  return arch;
}

function loadLanguages() {
  var languages=localStorage.lang;
  var defaultlang=localStorage.deflang;
  var arrLanguages=languages.split(",");
  var options="";
  for (var i=0; i<arrLanguages.length; i++) {
    var optLanguage=arrLanguages[i].split("|");
    if (defaultlang==optLanguage[0]) { var selected=" selected"; } else { var selected=""; }
    options=options + "<option value='" + optLanguage[0] + "'" + selected + ">" + optLanguage[1] + "</option>";
  }
  $("#settings-languages").html(options);
}

function checkThemes() {
 var options=""; var found="no"; var defTheme="";
 //console.log("Start checkThemes.");
 if ($(".versions").val()=="") {
 } else {
   try {
     //console.log("AX Check.");
     //--- AX ---
     var exists=fs.statSync($(".versions").val() + "\\lib\\brand.properties").toString().split("\n");
     var defTheme=localStorage.defthemeAX;
     var defThemePath=localStorage.defthemesAX;
     var verType="AX";
     //console.log("Starting version check.");
     var oldAX=checkAXVersion();
     //console.log("Version: " + oldAX);
   } catch(e) { 
     try {
       //console.log("AX Check Failed.. N4 Check.");
       //--- N4 ---
       var exists=fs.statSync($(".versions").val() + "\\etc\\brand.properties").toString().split("\n");
       var defTheme=localStorage.defthemeN4;
       var defThemePath=localStorage.defthemesN4;
       var verType="N4";
     } catch(e) { 
       //console.log("N4 Check Failed."); 
     }
   }
   var modules=fs.readdirSync($(".versions").val() + "\\modules\\");
   //console.log("Starting module loop.");
   for (var i=0; i<modules.length; i++) {
     if (modules[i].indexOf("theme")>=0) {
       //console.log("found theme: " + modules[i]);
       modName=modules[i].replace(".jar","").replace("-ux","").replace("theme","");
       if (modName==defTheme) { var selected=" selected"; found="yes"; } else { var selected=""; }
       options=options + "<option value='" + modName + "'" + selected + ">" + modName + "</option>";
     }
   }
   //console.log("End module loop.");
   var useThemes=localStorage.usethemes;
   if ((useThemes=="true") && (found=="no") && (!defTheme=="")) {
     //--- Copy theme to this installation ---
     //console.log("Copy theme to this installation.");
     exec("copy /-Y " + defThemePath + " " + $(".versions").val() + "\\modules\\");
     options=options + "<option value='" + defTheme + "' selected>" + defTheme + "</option>";
   }
   if ((useThemes=="false") || (oldAX==true)) { 
     //console.log("Themes disabled.");
     $("#theme").hide(0); 
     $("#theme").html("<select class='selected-theme' data-version='" + verType + "' title='Selected Theme'></select>");
   } else { 
     //console.log("Themes enabled.");
     $("#theme").show(0); 
     $("#theme").html("<select class='selected-theme' data-version='" + verType + "' title='Selected Theme'>" + options + "</select>");
   }
 }
 //console.log("End checkThemes.");
}

function saveTheme(version) {
  //console.log("Start saveTheme.");
  var modules=fs.readdirSync($(".versions").val() + "\\modules\\");
  for (var i=0; i<modules.length; i++) {
    if (modules[i].replace(".jar","").replace("-ux","").replace("theme","")==$(".selected-theme").val()) {
      //console.log("Found module path.");
      modNamePath=$(".versions").val() + "\\modules\\" + modules[i];
      modName=$(".selected-theme").val();
    }
  }
  if (version=="AX") {
    //console.log("Updated AX local storage.");
    localStorage.defthemeAX=modName;
    localStorage.defthemesAX=modNamePath;
  } else if (version=="N4") {
    //console.log("Updated N4 local storage.");
    localStorage.defthemeN4=modName;
    localStorage.defthemesN4=modNamePath;
  }
  //console.log("End saveTheme.");
}

function setTheme() {
  //console.log("Start setTheme.");
  var version=$(".selected-theme").attr("data-version");
  if (version=="AX") {
    //console.log("Using AX brandFile.");
    var brandFile=$(".versions").val() + "\\lib\\brand.properties";
  } else if (version=="N4") {
    //console.log("Using N4 brandFile.");
    var brandFile=$(".versions").val() + "\\etc\\brand.properties";
  }
  if (localStorage.usethemes=="true") {
    //console.log("Themes enabled.");
    try {
      //console.log("Reading brandFile.");
      var array = fs.readFileSync(brandFile).toString().split("\n");
      var newArrayStr=""; var wtd=false; var wtl=false;
      for(i in array) {
        if (array[i].indexOf("workbench.theme.default")>=0) {
          newArrayStr=newArrayStr + "workbench.theme.default=" + $(".selected-theme").val() + "\n";
          wtd=true;
        } else if (array[i].indexOf("workbench.theme.locked")>=0) {
          newArrayStr=newArrayStr + "workbench.theme.locked=true";
          wtl=true;
        } else {
          newArrayStr=newArrayStr + array[i] + "\n";
        }
      }
      if (wtd==false) { newArrayStr=newArrayStr + "workbench.theme.default=" + $(".selected-theme").val() + "\n"; }
      if (wtl==false) { newArrayStr=newArrayStr + "workbench.theme.locked=true"; }
      //console.log("Deleting brandFile.");
      fs.unlinkSync(brandFile);
      //console.log("Recreating brandFile with theme set." + newArrayStr);
      fs.writeFileSync(brandFile, newArrayStr);
    } catch(e) { 
      //console.log("Set Theme Error: " + e); 
    }
  } else {
    //console.log("Themes disabled.");
    try {
      //console.log("Reading brandFile.");
      var array = fs.readFileSync(brandFile).toString().split("\n");
      var newArrayStr=""; var wtl=false;
      for(i in array) {
        if (array[i].indexOf("workbench.theme.default")>=0) {
        } else if (array[i].indexOf("workbench.theme.locked")>=0) {
          newArrayStr=newArrayStr + "workbench.theme.locked=false";
          wtl=true;
        } else {
          newArrayStr=newArrayStr + array[i] + "\n";
        }
      }
      if (wtl==false) { newArrayStr=newArrayStr + "workbench.theme.locked=false"; }
      //console.log("Deleting brandFile.");
      fs.unlinkSync(brandFile);
      //console.log("Recreating brandFile unlocked." + newArrayStr);
      fs.writeFileSync(brandFile, newArrayStr);
    } catch(e) { 
      //console.log("Lock Theme Error: " + e); 
    }
  }
  //console.log("End setTheme.");
}

function checkAXVersion() {
  var array = fs.readFileSync($(".versions").val() + "\\lib\\devkit.properties").toString().split("\n");
  for(i in array) {
    if (array[i].indexOf("build=")>=0) {
      if (array[i].replace("build=","")<"3.6.999") {
        return true;
      } else {
        return false;
      }
    }
  }
}

function checkDaemon() {
  var found="no";
  exec("sc query Niagara", function(err, stdout) {
      var lines = stdout.toString().split("\r\n").filter(function (line) {  
        return true;
      }).map(function (lines) {
        return lines;
      });
      for(i in lines) {
        if (lines[i].indexOf("STATE")>=0) {
          found="yes";
          status=lines[i].replace("STATE","").replace(":","").trim().substring(1).trim();
        }
      }
      exec("sc qc Niagara", function(err, stdout) {
        var lines = stdout.toString().split("\r\n").filter(function (line) {  
          return true;
        }).map(function (lines) {
          return lines;
        });
        for(i in lines) {
          if (lines[i].indexOf("BINARY_PATH_NAME")>=0) {
            output=lines[i].replace("BINARY_PATH_NAME","").replace(":","").replace("\\bin\\niagarad.exe","").replace(/\"/g,"").trim();
            runPath=output;
            output=output.substring((+output.indexOf("\\")+1));
            output=output.substring((+output.indexOf("\\")+1));
            found="yes";
          }
        }
        var arch=checkArch(runPath);
        $(".daemon-status").html(output + " <span class='arch x" + arch + "'>" + arch + "-bit</span> <span class='status " + status.toLowerCase() + "' data-daemon-folder='" + output + "'>" + status + "</span>");
        //--- Daemon Notification Addon ---
        if ((localStorage.lastState!=status) && (localStorage.usepopups=="true")) {
          if (status=="RUNNING") {
            var options = {
              icon: "images/rocket_icon.png",
              body: output + " daemon started"
            };
            var notification = new Notification("Niagara Daemon Started",options);
            notification.onshow = function () { setTimeout(function() {notification.close();}, 4000); }
          }
        }
        localStorage.lastState=status;
        //--- Daemon Notification Addon End ---
      });
    if (found=="no") {
      $(".daemon-status").html("Daemon not found!");
    }  
  });
}

function checkHostID() {
  try {
    exec("bin\\nre.exe -hostid",{ cwd:$(".versions").val() }, function(err, stdout) {
      var lines = stdout.toString().split("\r\n").filter(function (line) {  
        return true;
      }).map(function (lines) {
        return lines;
      });
      for(i in lines) {
        if (lines[i].indexOf("HostId:")>=0) {
          HostIdValue=lines[i].replace("HostId:","").trim();
        }
      }
      if (HostIdValue!="") {
        $(".hostid").html(HostIdValue);
      } else {
        $(".hostid").html("Couldn't find Host ID");
      }
    });
  } catch (e) { console.log(e); }
}

function launchProgram(option) {
  var showPopup=false;var bodyMessage="";
  if (($(".status").html()!="RUNNING") && (option!="daemon")){
    bodyMessage="Niagara daemon currently not running!!";
    showPopup=true;
  }
  if (($(".versions").find(':selected').attr('data-folder')!=$(".status").attr('data-daemon-folder')) && (option!="daemon")) {
    if (bodyMessage=="") {
      bodyMessage="Launched version doesn't match running daemon!!";
    } else {
      bodyMessage="Niagara daemon mismatched and not running!!";
    }
    showPopup=true;
  }
  if ((showPopup==true) && (localStorage.usepopups=="true")) {
    var options = {
      icon: "images/rocket_icon.png",
      body: bodyMessage
    };
    var notification = new Notification("Workplace Launcher Warning",options);
    notification.onshow = function () { setTimeout(function() {notification.close();}, 20000); }
  }
  if (option=="daemon") {
    if (localStorage.daemonLock=="false") {
      closeWaiting(3000,option);
      elevate("bin\\plat.exe installdaemon",{cwd:$(".versions").val()});
    }
  } else if (option=="program-no-console") {
    if (localStorage.programLock=="false") {
      if (localStorage.useAutoSync=="true") { loadConnections(); saveConnections(); }
      closeWaiting(2000,option);
      setTheme();
      spawn($(".versions").val() + "\\bin\\wb_w.exe", ["-locale:" + localStorage.deflang],{ detached: true, stdio: ['ignore'] });
      localStorage.lastused=$(".versions").val();
    }
  } else if (option=="program-console") {
    if (localStorage.programConsoleLock=="false") {
      if (localStorage.useAutoSync=="true") { loadConnections(); saveConnections(); }
      closeWaiting(2000,option);
      setTheme();
      var allArgs = ["/c","start",'bin\\wb.exe',"-locale:" + localStorage.deflang];
      var command = process.env.comspec || "cmd.exe";
      spawn(command,allArgs , { cwd:$(".versions").val(),windowsVerbatimArguments: true });
      localStorage.lastused=$(".versions").val();
    }
  } else if (option=="console-only") {
    if (localStorage.consoleLock=="false") {
      closeWaiting(500,option);
      nw.Shell.openItem($(".versions").val() + "\\bin\\console.exe");
    }
  }
}

function closeWaiting(time,option) {
  if (option=="daemon") {
    daemonInterval=setInterval(dTimer,time);
    localStorage.daemonLock=true;
  } else if (option=="program-no-console") {
    programOnlyInterval=setInterval(pOTimer,time);
    localStorage.programLock=true;
  } else if (option=="program-console") {
    programConsoleInterval=setInterval(pCTimer,time);
    localStorage.programConsoleLock=true;
  } else if (option=="console-only") {
    consoleInterval=setInterval(cTimer,time);
    localStorage.consoleLock=true;
  }
}

function dTimer() {
  localStorage.daemonLock=false;
  clearInterval(daemonInterval);
}

function pOTimer() {
  localStorage.programLock=false;
  clearInterval(programOnlyInterval);
}

function pCTimer() {
  localStorage.programConsoleLock=false;
  clearInterval(programConsoleInterval);
}

function cTimer() {
  localStorage.consoleLock=false;
  clearInterval(consoleInterval);
}

function unlockAll() {
  localStorage.daemonLock=false;
  localStorage.programLock=false;
  localStorage.programConsoleLock=false;
  localStorage.consoleLock=false;
}

function loadConnections() {
  console.log("Start load.");
  if ($(".versions").find(":selected").attr("data-arch")=="AX") {
    var navTreeMaster=localStorage.navTreeMaster;
  } else {
    var navTreeMaster=localStorage.navTreeN4Master;
  }
  if (navTreeMaster!="") {
    var version=$(".versions").find("[data-folder='" + navTreeMaster + "']").attr("data-arch");
    if (version=="AX") {
      //console.log("Using AX navTree.");
      var navTree=localStorage.navTreeVer + "\\users\\" + process.env.USERNAME + "\\navTree.xml";
    } else if (version=="N4") {
      //console.log("Using N4 navTree.");
      var homedir=process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
      var nver=getNREVersion();
      var brand=getBrand();
      var navTree=homedir + "\\Niagara" + nver + "\\" + brand + "\\etc\\navTree.xml";
      //console.log(navTree);
    }
    try {
      //console.log("Reading navTree.");
      var slaveData = fs.readFileSync($(".versions").val() + "\\users\\" + process.env.USERNAME + "\\navTree.xml", 'ascii');
      var slavexmlDoc = $.parseXML( slaveData );
      var $slavexml = $( slavexmlDoc );
      var masterData = fs.readFileSync(navTree, 'ascii');
      var masterxmlDoc = $.parseXML( masterData );
      var $masterxml = $( masterxmlDoc );
      var fileData = "";
      $masterxml.find("host").each(function() {
        var found=false;
        var masterHost=$(this);
        $slavexml.find("host").each(function() {
          var slaveHost=$(this);
          //console.log(masterHost.attr("ord") + " - " + slaveHost.attr("ord"));
          if (masterHost.attr("ord")==slaveHost.attr("ord")) {
            found=true;
          }
        });
        if (found==true) {
          console.log(masterHost.attr("ord") + " found");
        } else {
          console.log("creating element");
          var sessionStr="";
          masterHost.children().each(function() {
            sessionStr=sessionStr + "  <session agent='" + $(this).attr("agent") + "'";
            if ($(this).attr("port")!=null) { sessionStr=sessionStr + " port='" + $(this).attr("port") + "'"; }
            if ($(this).attr("useFoxs")!=null) { sessionStr=sessionStr + " useFoxs='" + $(this).attr("useFoxs") + "'"; }
            if ($(this).attr("stationName")!=null) { sessionStr=sessionStr + " stationName='" + $(this).attr("stationName") + "'"; }
            sessionStr=sessionStr + " blah='blah'/>\n";
          });
          $(slavexmlDoc).find("navTree").append(" <host ord='" + masterHost.attr("ord") + "'>\n" + sessionStr + " </host>\n");
          fileData=(new XMLSerializer()).serializeToString(slavexmlDoc);
        }
      });
      localStorage.navTreeData=fileData;
    } catch(e) { 
      console.log("Read navTree Error: " + e); 
    }
  }
  console.log("End load.");
}

function setSyncMaster(ver) {
  //console.log("set Master");
  if (ver=="AX") {
    localStorage.navTreeVer=$("#settings-ax-master").val();
    localStorage.navTreeMaster=$("#settings-ax-master").find(':selected').attr("data-folder");
  } else if (ver=="N4"){
    localStorage.navTreeN4Ver=$("#settings-n4-master").val();
    localStorage.navTreeN4Master=$("#settings-n4-master").find(':selected').attr("data-folder");
  }
  checkAutoSync();
  loadConnections();
}

function saveConnections() {
  //console.log("starting save con");
  var saveCheck=false;
  if ($(".versions").find(":selected").attr("data-arch")=="AX") {
    if (localStorage.navTreeMaster!="") { saveCheck=true; }
  } else {
    if (localStorage.navTreeN4Master!="") { saveCheck=true; }
  }
  if ((localStorage.navTreeData=="") || (saveCheck==false)) {
    console.log("No Connection data stored please store connections first.");
  } else {
    var version=$(".selected-theme").attr("data-version");
    if (version=="AX") {
      //console.log("Using AX navTree.");
      var navTree=$(".versions").val() + "\\users\\" + process.env.USERNAME + "\\navTree.xml";
    } else if (version=="N4") {
      //console.log("Using N4 navTree.");
      var homedir=process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
      var nver=getNREVersion();
      var brand=getBrand();
      var navTree=homedir + "\\Niagara" + nver + "\\" + brand + "\\etc\\navTree.xml";
      //console.log(navTree);
    }
    try {
      try {
        fs.unlinkSync(navTree);
      } catch(e) { console.log("navTree file not found!"); }
      fs.writeFileSync(navTree, localStorage.navTreeData);
      //console.log("NavTree updated!");
    } catch(e) { 
      console.log("Save navTree Error: " + e); 
    }
  }
}

function exportSyncFile(path) {
  var version=$(".versions").find("[data-folder='" + localStorage.navTreeMaster + "']").attr("data-arch");
  if (version=="AX") {
    //console.log("Using AX navTree.");
    var navTree=localStorage.navTreeVer + "\\users\\" + process.env.USERNAME + "\\navTree.xml";
  } else if (version=="N4") {
    //console.log("Using N4 navTree.");
    var homedir=process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var nver=getNREVersion();
    var brand=getBrand();
    var navTree=homedir + "\\Niagara" + nver + "\\" + brand + "\\etc\\navTree.xml";
    //console.log(navTree);
  }
  try {
    //console.log("Reading navTree.");
    exec("copy /-Y " + navTree + " " + path);
    //console.log("navTree File Exported");
    nw.Shell.showItemInFolder(path + "\\navTree.xml");
  } catch(e) { 
    console.log("Load navTree Error: " + e); 
  }
}

function importSyncFile(path) {
  var version=$(".versions").find(":selected").attr("data-arch");
  if (version=="AX") {
    //console.log("Using AX navTree.");
    var navTree=$(".versions").val() + "\\users\\" + process.env.USERNAME;
  } else if (version=="N4") {
    //console.log("Using N4 navTree.");
    var homedir=process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var nver=getNREVersion();
    var brand=getBrand();
    var navTree=homedir + "\\Niagara" + nver + "\\" + brand + "\\etc\\navTree.xml";
    //console.log(navTree);
  }
  try {
    //console.log("Reading navTree.");
    try {
      fs.unlinkSync(navTree + "\\navTree.xml");
    } catch(e) { console.log("navTree file not found!"); }
    exec("copy /-Y " + path + " " + navTree + "\\navTree.xml");
    //console.log("navTree File Imported");
    alert("Import successful!");
  } catch(e) { 
    console.log("Load navTree Error: " + e); 
  }
}

function getNREVersion() {
  var array = fs.readFileSync(localStorage.navTreeN4Ver + "\\bin\\nreVersion.xml").toString().split("\n");
  for(i in array) {
    if (array[i].indexOf("version=\"4")>=0) {
      return array[i].substr((array[i].indexOf("version=\"4")+9),3).trim();
    }
  }
}

function getBrand() {
  var array = fs.readFileSync(localStorage.navTreeN4Ver + "\\etc\\brand.properties").toString().split("\n");
  for(i in array) {
    if (array[i].indexOf("brand.id=")>=0) {
      return array[i].substr((array[i].indexOf("brand.id=")+9)).trim();
    }
  }
}

function checkAutoSync() {
  if ($(".versions").find(":selected").attr("data-arch")=="AX") {
    $(".syncMasterLabel").html("AX Master:");
    if (localStorage.navTreeMaster=="") {
      $(".syncMaster").html("Not Set");
    } else {
      $(".syncMaster").html(localStorage.navTreeMaster);
    }
  } else {
    $(".syncMasterLabel").html("N4 Master:");
    if (localStorage.navTreeN4Master=="") {
      $(".syncMaster").html("Not Set");
    } else {
      $(".syncMaster").html(localStorage.navTreeN4Master);
    }
  }
}

function openFolder() {
  nw.Shell.openItem($(".versions").val());
}

function checkNRE() {
  $(".memory-version").html($(".versions").find(':selected').attr('data-folder'));
  if ($(".versions").find(":selected").attr("data-arch")=="AX") {
    var NREFile=$(".versions").val() + "\\lib\\nre.properties";
    $(".memory-ax-section").removeClass("super-hide");$(".memory-n4-section").addClass("super-hide")
  } else {
    var NREFile=$(".versions").val() + "\\defaults\\nre.properties";
    $(".memory-ax-section").addClass("super-hide");$(".memory-n4-section").removeClass("super-hide")
  }
  var array = fs.readFileSync(NREFile).toString().split("\n");
  for(i in array) {
    if ($(".versions").find(":selected").attr("data-arch")=="AX") {
      if (array[i].indexOf("java.options=")>=0) {
        var options=array[i].replace("java.options=","");
        var arrOptions=options.split(" ");
        for(opt in arrOptions) {
          if (arrOptions[opt].indexOf("-Xmx")>=0) {
            var Xmx=arrOptions[opt].substring(4).replace(/\D/g,'');
          } else if (arrOptions[opt].indexOf("-Xss")>=0) {
            var Xss=arrOptions[opt].substring(4).replace(/\D/g,'');
          } else if (arrOptions[opt].indexOf("-XX:MaxPermSize")>=0) {
            var Mps=arrOptions[opt].substring(15).replace(/\D/g,'');
          }
        }
      }
    } else {
      console.log(array[i]);
      if (array[i].indexOf("station.java.options=")>=0) {
        var options=array[i].replace("station.java.options=","");
        var arrOptions=options.split(" ");
        for(opt in arrOptions) {
          if (arrOptions[opt].indexOf("-Xmx")>=0) {
            var StationXmx=arrOptions[opt].substring(4).replace(/\D/g,'');
          } else if (arrOptions[opt].indexOf("-Xss")>=0) {
            var StationXss=arrOptions[opt].substring(4).replace(/\D/g,'');
          }
        }
      } else if (array[i].indexOf("wb.java.options=")>=0) {
        var options=array[i].replace("wb.java.options=","");
        var arrOptions=options.split(" ");
        for(opt in arrOptions) {
          if (arrOptions[opt].indexOf("-Xmx")>=0) {
            var WbXmx=arrOptions[opt].substring(4).replace(/\D/g,'');
          } else if (arrOptions[opt].indexOf("-Xss")>=0) {
            var WbXss=arrOptions[opt].substring(4).replace(/\D/g,'');
          }
        }
      }
    }
  }
  if ($(".versions").find(":selected").attr("data-arch")=="AX") {
    $("#ax-heap").val(Xmx);$("#ax-stack").val(Xss);$("#ax-perm").val(Mps);
  } else {
    $("#s-heap").val(StationXmx);$("#s-stack").val(StationXss);$("#wb-heap").val(WbXmx);$("#wb-stack").val(WbXss);
  }
}

function setNRE() {
  var version=$(".selected-theme").attr("data-version");
  if (version=="AX") {
    var NREFile=$(".versions").val() + "\\lib\\nre.properties"; 
    try {
      var array = fs.readFileSync(NREFile).toString().split("\n");
      var newArrayStr="";
      for(i in array) {
        if (array[i].indexOf("java.options")>=0) {
          newArrayStr=newArrayStr + "java.options=-Xmx" + $("#ax-heap").val() + "M -XX:MaxPermSize=" + $("#ax-perm").val() + "M -Dfile.encoding=UTF-8 -Xss" + $("#ax-stack").val() + "K\n";
        } else {
          newArrayStr=newArrayStr + array[i] + "\n";
        }
      }
      fs.unlinkSync(NREFile);
      fs.writeFileSync(NREFile, newArrayStr);
    } catch(e) { 
    }
  } else if (version=="N4") {
    var NREFile=$(".versions").val() + "\\defaults\\nre.properties";
    try {
      var array = fs.readFileSync(NREFile).toString().split("\n");
      var newArrayStr="";
      for(i in array) {
        if (array[i].indexOf("station.java.options")>=0) {
          newArrayStr=newArrayStr + "station.java.options=-Dfile.encoding=UTF-8 -Xss" + $("#s-stack").val() + "K -Xmx" + $("#s-heap").val() + "M\n";
        } else if (array[i].indexOf("wb.java.options")>=0) {
          newArrayStr=newArrayStr + "wb.java.options=-Dfile.encoding=UTF-8 -Xss" + $("#wb-stack").val() + "K -Xmx" + $("#wb-heap").val() + "M \n";
        } else {
          newArrayStr=newArrayStr + array[i] + "\n";
        }
      }
      fs.unlinkSync(NREFile);
      fs.writeFileSync(NREFile, newArrayStr);
    } catch(e) { 
    }
  }
}

function resetMemory() {
  var version=$(".selected-theme").attr("data-version");
  if (version=="AX") {
    $("#ax-heap").val("256");$("#ax-perm").val("128");$("#ax-stack").val("256");
  } else {
    $("#s-heap").val("512");$("#s-stack").val("512");$("#wb-heap").val("1024");$("#wb-stack").val("512");
  }
}

$(function() {
  checkSettingsFile();
  loadVersions();
  loadLanguages();
  checkDaemon();
  unlockAll();
  setInterval(checkDaemon,1000);
  if (!$(".versions").val()=="") {
    checkThemes();
    checkHostID();
    checkAutoSync();
    checkNRE();
  }
});