/*******************************
 * Depdency Tree Visualizer
 * Kai Zhao, July 2013
 *******************************/

String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
}

function generatetree(){
	$("#alert").hide();
	spanbox = $("#spanbox");
	spanbox.empty();
	spanbox.show();
	$("#canvas").show();
	var text = $("#input").val().trim();
	var sent = new Array();
	if($("#deptype_parentheses").prop("checked"))
		parse_parentheses(text, sent);
	else if($("#deptype_conll").prop("checked"))
		parse_conll(text, sent);
	else if($("#deptype_stanford").prop("checked"))
		parse_stanford(text, sent);
	else
		return;
	if (sent.length == 0)
		return;
	sent.sort(function(a, b) {return a[0] - b[0];});
	//try to draw it to get the actuall span width
	for(var i=0; i<sent.length; ++i ){
		console.log(i + " " + sent[i][0] + " " + sent[i][1] + " " + sent[i][2]);
		toinsert = "<span id=\"node"+sent[i][0]+"\"";
		if(sent[i][2].length > 0){
			toinsert += " ids=\"";
			for (var j=0; j<sent[i][2].length; ++j)
				toinsert += "node" + sent[i][2][j] + " ";
			toinsert = toinsert.trim(); 
			toinsert += "\"";
		}
		toinsert += ">" + sent[i][1]+"</span>&nbsp;&nbsp;&nbsp;&nbsp;";
		spanbox.append(toinsert);
	}
	var canvasdiv = document.getElementById("canvas");
  	var spanboxdiv = document.getElementById("spanbox");
	canvasdiv.width = spanbox.width() + 20;
  	canvasdiv.height = canvasdiv.width / 2;
  	spanboxdiv.style.position="relative";
  	spanbox.empty();
  	// now draw it
  	for(var i=0; i<sent.length; ++i ){
		toinsert = "<span id=\"node"+sent[i][0]+"\"";
		if(sent[i][2].length > 0){
			toinsert += " ids=\"";
			for (var j=0; j<sent[i][2].length; ++j)
				toinsert += "node" + sent[i][2][j] + " ";
			toinsert = toinsert.trim(); 
			toinsert += "\"";
		}
		toinsert += ">" + sent[i][1]+"</span>&nbsp;&nbsp;&nbsp;&nbsp;";
		spanbox.append(toinsert);
	}
	spanboxdiv.style.top=-50;
	spanboxdiv.style.left=10;
	draw();
}

function parse_conll(text, sent){
	var lines = text.split("\n");
	var edges = new Array();
	for (var i=0; i<=lines.length;++i) edges.push(new Array());
	for (var i=0;i<lines.length;++i){
		line = lines[i].trim();
		items = line.split(/[ \t]+/g);
		if (items[0]==undefined || items[1]==undefined || items[4]==undefined || items[6] == undefined || !/^[0-9]+$/.test(items[0].trim()) || !/^[0-9]+$/.test(items[6].trim())){
			error_parse();
			return null;
		}
		modidx = parseInt(items[0].trim());
		modword = items[1].trim();
		if(items[4].trim()!="_")
			modword += "/"+items[4].trim();
		headidx = items[6].trim();
		edges[headidx].push(modidx);
		sent.push([modidx, modword, edges[modidx]]);
	}
}


function parse_stanford(text, sent){
	var lines = text.split("\n");
	var edges = new Array();
	for (var i=0; i<=lines.length; ++i) edges.push(new Array());
	for (var i=0; i<lines.length; ++i){
		var splits = lines[i].split("(", 2);
		var label = splits[0];
		var rest = splits[1];
		splits = rest.split(")", 2);
		rest = splits[0];
		splits = rest.split(", ", 2);
		var leftsplits = splits[0].rsplit("-", 1);
		var headidx = leftsplits[1];
		var rightsplits = splits[1].rsplit("-", 1);
		var modword = rightsplits[0];
		var modidx = parseInt(rightsplits[1]);
		while (edges.length <= headidx || edges.length <= modidx)
			edges.push(new Array());
		edges[headidx].push(modidx);
		sent.push([modidx, modword, edges[modidx]]);
	}
}

function parse_parentheses(text, sent){
	ret = _parse_parnetheses(text, 0, sent);
}

function _parse_parnetheses(text, index, sent){
	if (text.charAt(index)!='(') {
		error_parse();
		return null;
	}
	index += 1;
	var children = new Array();
	var headword =  "";
	var headidx = -1;
	while (text.charAt(index)!=')'){
		if(text.charAt(index)=='('){
			ret = _parse_parnetheses(text, index, sent);
			childidx = ret[0];
			children.push(childidx);
			index = ret[1];
		} else {
			var rpos = -1;
			var rposws = text.indexOf(' ', index);
			var rpospar = text.indexOf(')', index);
			if (rposws < 0 && rpospar >= 0)
				rpos = rpospar;
			else if (rposws >= 0 && rpospar < 0)
				rpos = rposws;
			else if (rposws >= 0 && rpospar >= 0)
				rpos = Math.min(rposws, rpospar);
			else {// rposws <0 && rpospar < 0 
				error_parse();
				return null;
			}
			headword = text.substring(index, rpos);
			headidx = index;
			index = rpos;
			//console.log(headword + " " + headidx + " " + rpos + "charAT" + text.charAt(headidx) + " | " +text.indexOf(')', headidx) + text.charAt(text.indexOf(')', headidx)));
		}
		if (text.charAt(index) == ' ') index += 1;
	}
	sent.push([headidx, headword, children]);
	return [headidx, index+1];
}

function error_parse(){
	$("#canvas").hide();
	$("#spanbox").hide();
	$('#alert').show();
}