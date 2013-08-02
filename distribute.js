var firebaseMaster = new Firebase('http://paillier-cs.firebaseIO.com/');
var myId;
var awaitingConsensus = 0;
var recId = [];
var recSum = [];

function makeId() {
	id = '';
	for (i = 0; i < 36; i++) {
		id += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
	}
	return id;
}

function distributeAddition() {
	if (awaitingConsensus == 1) {
		return;
	}
	var decA = str2bigInt($('#inpA').val(), 10, bitLength, bitLength);
	var decB = str2bigInt($('#inpB').val(), 10, bitLength, bitLength);
	var cipherA = encryptInteger(decA, publicKey[0], publicKey[1]);
	var cipherB = encryptInteger(decB, publicKey[0], publicKey[1]);
	myId = makeId();
	addToLog('[' + strip6(myId) + '] ');
		addToLog('Requested multiplication of ');
		addBigIntToLog(cipherA);
		addToLog(' and ');
		addBigIntToLog(cipherB);
		addToLog('\n');
	recSum = [];
	awaitingConsensus = 1;
	firebaseMaster.push({action: 'add', 
						 date: Date.now(),
						 id: myId,
						 cA: bigInt2str(cipherA, 2),
						 cB: bigInt2str(cipherB, 2),
						 n:  bigInt2str(publicKey[0], 2)});
	$('#outC').val('Awaiting network consensus...');
	$('#outC').addClass('btn-inverse');
	$('#inpA, #inpB').attr('disabled', '');
	setTimeout(getConsensus, 5000);
}

var messageQuery = firebaseMaster.endAt().limit(10);

addToLog('Joining the network as a peer.\n');

messageQuery.on('child_added', function(snapshot) {
	var message = snapshot.val();
	if (message.action == 'add' &&
		$.inArray(message.id, recId) == -1 && 
		Date.now() - message.date < 5000) {

		var cA = str2bigInt(message.cA, 2, message.cA.length, message.cA.length);
		var cB = str2bigInt(message.cB, 2, message.cB.length, message.cB.length);
		var rN = str2bigInt(message.n , 2, message.n.length,  message.n.length);
		var sum= addEncIntegers(cA, cB, rN);
		addToLog('[' + strip6(message.id) + '] ');
			addToLog('Multiplied ');
			addToLog('cA = '); addBigIntToLog(cA);
			addToLog('; cB = '); addBigIntToLog(cB);
			addToLog('; cA * cB = '); addBigIntToLog(sum);
			addToLog('\n');

		firebaseMaster.push({
			action: 'send',
			id: message.id,
			answer: bigInt2str(sum, 2)
		});
		recId.push(message.id);

	} else if (message.action == 'send') {
		if (message.id == myId &&
			awaitingConsensus == 1) {
			recSum.push(str2bigInt(message.answer, 2, message.answer.length, message.answer.length));
		}
	}
});

function getConsensus() {
	var freqOfSum = 0;
	var popularSum;
	var histogram = {};
	for (var i = 0; i < recSum.length; i++) {
		sum = dup(recSum[i]);
		histogram[sum] = (histogram[sum] || 0) + 1;
		if (histogram[sum] > freqOfSum) {
			freqOfSum = histogram[sum];
			popularSum = dup(sum);
		}
	}
	awaitingConsensus = 0;
	$('#outC').val(bigInt2str(
		decryptRecAns(popularSum, publicKey[0],
			privateKey[0], privateKey[1]),
		10));
	$('#outC').removeClass('btn-inverse');
	$('#inpA, #inpB').removeAttr('disabled');
}
