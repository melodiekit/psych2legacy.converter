var charts = [];
var filesConverted = 0;
var filesTried = 0;
var filesLimit = 0;
document.getElementById("selector").addEventListener("change", function(e) {
	if (e.target.files.length > 0) {
		filesConverted = 0;
		filesTried = 0;
		filesLimit = e.target.files.length;
		const onlyConvertSustains = document.getElementById("onlySustains").checked;
		const sustainType = onlyConvertSustains ? document.querySelector("input[name='sustainOption']:checked").id : "legacy";
		const convertAsEvent = document.getElementById("asEvent").checked;
		for (let i = 0; i < e.target.files.length; i++) {
			convertChart(e.target.files[i], onlyConvertSustains, sustainType, convertAsEvent);
		}
	}
});

function convertChart(chart, onlyConvertSustains = false, sustainType = "legacy", convertAsEvent = false) {
	const fileName = chart.name;
	if (fileName.endsWith("events.json")) convertAsEvent = true;
	const reader = new FileReader();
	reader.addEventListener("load", function() {
		const parsed = JSON.parse(reader.result);
		convert(parsed, onlyConvertSustains, sustainType, convertAsEvent);
		filesTried++;
		if (filesTried == filesLimit) {
			window.alert(`Successfully converted ${filesConverted}/${filesLimit} files`);
		}
	});
	reader.readAsText(chart);

	function convert(c, s, st, e) {
		var oldChart = false;
		if (!e && !Object.hasOwn(c, "song")) { // Not valid chart file
			window.alert(`File "${fileName}" is not a valid chart file!`);
			return;
		}
		if (typeof(c.song) == "object") { // Old chart
			if (!s) {
				window.alert(`File "${fileName}" is not in the Psych 1.0 format!`);
				return;
			}
			else oldChart = true;
		}

		var song = oldChart ? c.song : c;
		if (e && Object.hasOwn(song, "bpm")) { // Chart file when Convert as Event is enabled
			window.alert(`File ${fileName} is a chart file and cannot be converted as an event!`);
			return;
		}
		if (!e) {
			var curBpm = song.bpm;
			for (let section of song.notes) {
				if (st == "legacy" && section.changeBPM == true && section.bpm != null && curBpm != section.bpm) curBpm = section.bpm;
				let curStepCrochet = 60 / curBpm * 1000 / 4;

				if (section.sectionNotes != null && section.sectionNotes.length > 0) {
					for (let notes of section.sectionNotes) {
						if (!s && !section.mustHitSection) {
							if (notes[1] > 3) notes[1] = notes[1] % 4;
							else notes[1] += 4;
						}
						if (notes[2] != null && notes[2] > 0) {
							if (st == "new") notes[2] += curStepCrochet;
							else if (st == "legacy") notes[2] -= curStepCrochet;
							if (notes[2] < 0) notes[2] = 0;
						}
					}
				}
			}
		}

		if (!s) {
			if (c.format == null || c.format != "psych_legacy_convert") c.format = "psych_legacy_convert";
			c = {song: c};
		}

		filesConverted++;

		const convertedFile = new File([JSON.stringify(c, null, 4)], fileName);
		const url = URL.createObjectURL(convertedFile);
		const downloader = document.getElementById("downloader");
		downloader.download = fileName;
		downloader.href = url;
		downloader.click();
	}
}