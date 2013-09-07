var firebaseMaster = new Firebase('http://paillier-cs.firebaseIO.com/');
var firebaseReference = {};

function Distribute(paillier, debugmode) {
	this.id = '';
	this.awaitingConsensus = 0;
	this.DEBUG = debugmode;
	this.pcs = paillier;
	this.recId = [];
	this.recSum= [];
	firebaseReference = this;

	this.makeID = function() {
		id = '';
		for (i = 0; i < 36; i++) {
			id += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
		}
		this.id = id;
	};
	this.distributeAddition = function() {
		if (this.awaitingConsensus) {
			return;
		}
		var decA = str2bigInt($('#inpA').val(), 10, 
					this.pcs.bitLength, this.pcs.bitLength);
		var decB = str2bigInt($('#inpB').val(), 10, 
					this.pcs.bitLength, this.pcs.bitLength);
		var cipherA = this.pcs.encryptInteger(decA);
		var cipherB = this.pcs.encryptInteger(decB);
		this.makeID();
		if (this.DEBUG) {
			addToLog('[' + strip6(this.id) + '] '
			+ 'Requested multiplication of ' + b2s(cipherA) + ' and '
			+ b2s(cipherB) + '\n');
		}
		this.recSum = [];
		this.awaitingConsensus = 1;
		firebaseMaster.push({action: 'add', 
							 date: Date.now(),
							 id: this.id,
							 cA: bigInt2str(cipherA, 2),
							 cB: bigInt2str(cipherB, 2),
							 n:  bigInt2str(this.pcs.n, 2)});
		if (this.DEBUG) {
			$('#outC').val('Awaiting network consensus...');
			$('#outC').addClass('btn-inverse');
			$('#inpA, #inpB').attr('disabled', '');
		}
		var _this = this;
		setTimeout(function(){_this.getConsensus();}, 5000);
	};

	this.getConsensus = function() {
		var freqOfSum = 0;
		var popularSum;
		var histogram = {};
		for (var i = 0; i < this.recSum.length; i++) {
			sum = dup(this.recSum[i]);
			histogram[sum] = (histogram[sum] || 0) + 1;
			if (histogram[sum] > freqOfSum) {
				freqOfSum = histogram[sum];
				popularSum = dup(sum);
			}
		}
		this.awaitingConsensus = 0;
		if (this.DEBUG) {
			$('#outC').val(bigInt2str(
				this.pcs.decryptRecAns(popularSum),
				10));
			$('#outC').removeClass('btn-inverse');
			$('#inpA, #inpB').removeAttr('disabled');
		}
	};
}

messageQuery = firebaseMaster.endAt().limit(10);

function messageQueryCallback(snapshot) {
	var msg = snapshot.val();
	var fbR = firebaseReference;
	if (msg.action == 'add' &&
		$.inArray(msg.id, fbR.recId) == -1 && 
		Date.now() - msg.date < 5000) {

		var cA = str2bigInt(msg.cA, 2, msg.cA.length, msg.cA.length);
		var cB = str2bigInt(msg.cB, 2, msg.cB.length, msg.cB.length);
		var rN = str2bigInt(msg.n , 2, msg.n.length,  msg.n.length);
		var sum= fbR.pcs.addEncIntegers(cA, cB, rN);

		if (fbR.DEBUG) {
			addToLog('[' + strip6(msg.id) + '] Multiplied '
			+ 'cA = ' + b2s(cA) + '; cB = ' + b2s(cB) + '; '
			+ 'cAcB = ' + b2s(sum) + '\n');
		}

		firebaseMaster.push({
			action: 'send',
			id: msg.id,
			answer: bigInt2str(sum, 2)
		});
		fbR.recId.push(msg.id);

	} else if (msg.action == 'send') {
		if (msg.id == this.id &&
			fbR.awaitingConsensus) {
			var ans = msg.answer;
			fbR.recSum.push(str2bigInt(ans, 2, ans.length, ans.length));
		}
	}
};

messageQuery.on('child_added', messageQueryCallback);
