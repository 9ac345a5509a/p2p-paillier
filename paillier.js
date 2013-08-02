var bitLength = 1024;

function initPaillier() {
  var p, q, n, g, nSquared;
	var pMinusOne, qMinusOne, cd, quo, rem;
	var lambda, mu;
	/* Find suitable p and q */
	do {
		p = randProbPrime(bitLength/2);
		q = randProbPrime(bitLength/2);
		pMinusOne = addInt(p, -1);
		qMinusOne = addInt(q, -1);
		n = mult(p, q);
	} while(!equalsInt(GCD(n, mult(pMinusOne, qMinusOne)), 1));
	nSquared = mult(n, n);

	addToLog('Generated n as ');
		addBigIntToLog(n);
		addToLog('\n');

	/* Calculate lambda=lcm(p-1, q-1)=(p-1)(q-1)/GCD(p-1, q-1)*/
	lambda = new Array(bitSize(n));
	rem = new Array(bitSize(n));
	cd = GCD(pMinusOne, qMinusOne);
	divide_(mult(pMinusOne, qMinusOne), cd, lambda, rem);
	addToLog('Generated λ as ');
		addBigIntToLog(lambda);
		addToLog('\n');

	/* Find suitable g such that mu exists */
	do {
		g = randIntMod(nSquared);
		mu = inverseMod(L(powMod(g, lambda, nSquared), n), n);
	} while(mu == null);
	addToLog('Generated μ as ');
		addBigIntToLog(mu);
		addToLog('\n');
	return [[n, g], [lambda, mu]];
}

function L(u, n) {
	var lAble = addInt(u, -1);
	var result, rem;
	result = dup(lAble);
	rem = dup(lAble);
	divide_(lAble, n, result, rem);
	return result;
}

function randIntMod(modulus) {
	var randomInt;
	do {
		randomInt = randBigInt(bitSize(modulus), 0);
	} while (greater(randomInt, modulus)); // Make sure random < modulus
	return randomInt;
}

function encryptInteger(m, n, g) {
	var r;
	var nSquared = mult(n, n);
	r = randIntMod(n);
	return multMod(powMod(g, m, nSquared), powMod(r, n, nSquared), nSquared);
}

function addEncIntegers(a, b, nRec) {
	return multMod(a, b, mult(nRec, nRec));
}

function decryptRecAns(cipherAns, n, lambda, mu) {
	var u = powMod(cipherAns, lambda, mult(n, n));
	var res;
	res = multMod(L(u, n), mu, n);
	return res;
}
