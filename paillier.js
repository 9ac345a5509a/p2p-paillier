function PaillierCS() {
	this.randIntMod = function(modulus) {
		var randomInt;
		do {
			randomInt = randBigInt(bitSize(modulus), 0);
		} while (greater(randomInt, modulus)); // Make sure random < modulus
		return randomInt;
	};
	this.L = function(u) {
		var lAble = addInt(u, -1);
		var result, rem;
		result = dup(lAble);
		rem = dup(lAble);
		divide_(lAble, this.n, result, rem);
		return result;
	};

	this.init = function(DEBUG) {
		this.bitLength = 1024;
		var p, q, nSquared;
		var pMinusOne, qMinusOne, cd, quo, rem;
		/* Find suitable p and q */
		do {
			p = randProbPrime(this.bitLength/2);
			q = randProbPrime(this.bitLength/2);
			pMinusOne = addInt(p, -1);
			qMinusOne = addInt(q, -1);
			this.n = mult(p, q);
		} while(!equalsInt(GCD(this.n, mult(pMinusOne, qMinusOne)), 1));
		nSquared = mult(this.n, this.n);

		if (DEBUG) {
			addToLog('Generated n as ');
			addBigIntToLog(this.n);
			addToLog('\n');
		}

		/* Calculate lambda=lcm(p-1, q-1)=(p-1)(q-1)/GCD(p-1, q-1)*/
		this.lambda = new Array(bitSize(this.n));
		rem = new Array(bitSize(this.n));
		cd = GCD(pMinusOne, qMinusOne);
		divide_(mult(pMinusOne, qMinusOne), cd, this.lambda, rem);
		if (DEBUG) {
			addToLog('Generated λ as ');
			addBigIntToLog(this.lambda);
			addToLog('\n');
		}

		/* Find suitable g such that mu exists */
		do {
			this.g  = this.randIntMod(nSquared);
			this.mu = inverseMod(
						this.L(powMod(this.g, this.lambda, nSquared)),
						this.n);
		} while(this.mu == null);

		if (DEBUG) {
			addToLog('Generated μ as ');
			addBigIntToLog(this.mu);
			addToLog('\n');
		}
	};

	this.encryptInteger = function(m) {
		var r;
		var nSquared = mult(this.n, this.n);
		r = this.randIntMod(this.n);
		return multMod(powMod(this.g, m, nSquared), 
			powMod(r, this.n, nSquared), nSquared);
	};

	this.addEncIntegers = function(a, b, nRec) {
		return multMod(a, b, mult(nRec, nRec));
	};

	this.decryptRecAns = function(cipherAns) {
		var u = powMod(cipherAns, this.lambda, mult(this.n, this.n));
		var res;
		res = multMod(this.L(u), this.mu, this.n);
		return res;
	}
}
