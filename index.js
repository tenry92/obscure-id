(() => {
  /**
   * Default function used for generating random numbers.
   */
  function defaultRandomFunction() {
    return Promise.resolve(Math.random());
  }

  /**
   * Generate two random numbers.
   *
   * @param {number} base
   * @param {function|[Promise<number>, Promise<number>]} [random] Random numbers to use.
   * @returns Promise<[number, number]>
   */
  async function generateRandomNumbers(base, random) {
    const promises = [];

    if (typeof random == 'undefined') {
      promises.push(defaultRandomFunction());
      promises.push(defaultRandomFunction());
    } else if (typeof random == 'function') {
      promises.push(random());
      promises.push(random());
    } else if (Array.isArray(random)) {
      if (random.length >= 2) {
        promises.push(Promise.resolve(random[0]));
        promises.push(Promise.resolve(random[1]));
      }
    }

    if (promises.length != 2) {
      throw new TypeError('"random" is not valid');
    }

    const results = await Promise.all(promises);

    return [(results[0] * base) | 0, (results[1] * base) | 0];
  }

  function assertConfiguration(generator) {
    if (generator.signatureLength < 0) {
      throw new RangeError('invalid signatureLength');
    }

    if (generator.index.length < 1) {
      throw new RangeError('invalid index');
    }

    if (generator.key.length < 1) {
      throw new RangeError('invalid key');
    }
  }

  /**
   * @property {string} key
   * @property {string} index
   * @property {number} defaultIdLength
   * @property {number} signatureLength
   * @property {function} randomFunction
   */
  class ObscuredIdGenerator {
    constructor(options) {
      this.resetConfiguration();

      if (typeof options == 'object' && options != null) {
        this.configure(options);
      }
    }

    configure(options) {
      for (const key in options) {
        this[key] = options[key];
      }

      return this;
    }

    resetConfiguration() {
      this.key = 'PleaseFillMe';
      this.index = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      this.defaultIdLength = 8;
      this.signatureLength = 2;
      this.randomFunction = defaultRandomFunction;

      return this;
    }

    /**
     * Determine the maximum possible ID
     *
     * @param {number} [length] Overwrite ID lenght to use.
     * @returns number
     */
    maxId(length) {
      assertConfiguration(this);

      if (typeof length != 'number') {
        if (typeof length == 'undefined') {
          length = this.defaultIdLength;
        } else {
          throw new TypeError('"length" is not a number');
        }
      }

      if (length - this.signatureLength <= 0) {
        throw new RangeError('invalid length');
      }

      const rawLength = length - this.signatureLength;

      return this.index.length ** rawLength;
    }

    /**
     * Obscure numeric ID or decode obscured ID.
     *
     * @param {number|string} id Numeric ID to obscure or obscured ID to decode.
     * @param {string} [length] Desired length of obscured ID to generate.
     * @param {function|[Promise<number>, Promise<number>]} [random] Random number generator or promises to use for generating obscured ID.
     * @returns {number|string} Obscured ID (string) or decoded numeric ID (number).
     */
    obscureId(id, length, random) {
      if (typeof id == 'number') {
        return this.generate(id, length, random);
      } else if (typeof id == 'string') {
        return this.decode(id);
      }

      throw new TypeError('"id" is not a number or a string');
    }

    /**
     * Obscure numeric ID.
     *
     * @param {number|string} id Numeric ID to obscure or obscured ID to decode.
     * @param {string} [length] Desired length of obscured ID to generate.
     * @param {function|[Promise<number>, Promise<number>]} [random] Random number generator or promises to use for generating obscured ID.
     * @returns {string} Obscured ID.
     */
    async generate(id, length, random) {
      assertConfiguration(this);

      if (typeof id != 'number') {
        throw new TypeError('"id" is not a number');
      }

      if (id < 1 || id > this.maxId(length)) {
        throw new RangeError('invalid id');
      }

      if (typeof length != 'number') {
        if (typeof length == 'undefined') {
          length = this.defaultIdLength;
        } else {
          throw new TypeError('"length" is not a number');
        }
      }

      if (length - this.signatureLength <= 0) {
        throw new RangeError('invalid length');
      }

      const base = this.index.length;

      // output length (without rand-signature)
      const rawLength = length - this.signatureLength;

      // calculate two random numbers
      const [r1, r2] = await generateRandomNumbers(base, random || this.randomFunction);

      // calculate single resulting number
      let r = r1 + r2 * base; // random number

      let key = this.key;
      let keyLength = key.length;

      // shift start of key according to random number r
      key = key.substr(r % keyLength) + key.substr(0, (r % keyLength));

      // prepend random key to the key
      key = this.index[r1] + this.index[r2] + key;
      keyLength += this.signatureLength; // also count random digits

      // output, shift state
      let out = '';
      let shift = 0;
      let n, k, ord;

      // while digits are still to be written
      for (n = 0; n < rawLength; ++n) {
        // calculate resulting 'key' (digit index)
        k = (id + shift) % base;

        // output resulting digit
        out += this.index[k];

        // remove written digits from input
        id = Math.floor(id / base);

        // get current char from key and its order
        ord = key.charCodeAt(n % keyLength);

        // calculate new shift value
        shift = (shift + k + ord) % base;
      }

      // randomize order
      let tmp = out;
      let c, i, p, j;
      out = '\0'.repeat(rawLength);

      // for each char in tmp
      for (n = 0; n < rawLength; ++n) {
        c = tmp[n];
        i = r % (rawLength - n);
        r = Math.floor(r / (rawLength - n));

        // string position
        p = 0;

        // skip set digits
        while(out[p] && out[p] != '\0') {
          ++p;
        }

        for (j = 0; j < i; ++j) {
          ++p;

          // skip set digits
          while(out[p] && out[p] != '\0') {
            ++p;
          }
        }

        if (p >= rawLength) {
          return false;
        }

        out = out.substring(0, p) + c + out.substring(p + 1);
      }

      // write random digits (signature)
      out = this.index[r1] + this.index[r2] + out;

      return out;
    }

    /**
     * Alias for `generate`.
     *
     * @see generate
     */
    encode(id, length, random) {
      return this.generate(id, length, random);
    }

    /**
     * Decode obscured ID.
     *
     * @param {string} id Obscured ID to decode.
     * @returns {number} Decoded numeric ID.
     */
    async decode(id) {
      assertConfiguration(this);

      if (typeof id != 'string') {
        throw new TypeError('"id" is not a string');
      }

      for (const char of id) {
        if (this.index.indexOf(char) == -1) {
          throw new TypeError('"id" is invalid');
        }
      }

      const rawLength = id.length - this.signatureLength;
      const base = this.index.length;

      let key = this.key;

      let out = 0;
      let shift = 0;

      // unrandomize order
      let tmp = '';

      const r1 = id[0];
      const r2 = id[1];

      let r = this.index.indexOf(r2) * base + this.index.indexOf(r1);

      let keyLength = key.length;

      // shift start of key according to random number r
      key = key.substr(r % keyLength) + key.substr(0, (r % keyLength));

      key = r1 + r2 + key;
      keyLength += this.signatureLength;

      id = id.substr(this.signatureLength);

      let n, i, c, ord;

      // for each digit
      for (n = 0; n < rawLength; ++n) {
        i = r % (rawLength - n);
        c = id[i];
        r = Math.floor(r / (rawLength - n));

        tmp += c;

        // remove digit
        id = id.substr(0, i) + id.substr(i + 1);
      }

      id = tmp;

      for (n = 0; n < rawLength; ++n) {
        r = id[n];
        i = this.index.indexOf(r);
        if (i == -1) {
          return false;
        }

        i -= shift;
        if (i < 0) {
          i += base;
        }

        out += i * Math.pow(base, n);

        c = key[n % keyLength];
        ord = c.charCodeAt(0);
        shift = (shift + (i + shift) % base + ord) % base;

        // while(shift < 0) {
        //   shift += base;
        // }
      }

      return out;
    }
  }

  const generator = new ObscuredIdGenerator();

  function obscureId(id, length, random) {
    return generator.obscureId(id, length, random);
  }

  obscureId.configure = (...args) => { generator.configure(...args); return obscureId; };
  obscureId.resetConfiguration = () => { generator.resetConfiguration(); return obscureId; };
  obscureId.maxId = (...args) => generator.maxId(...args);
  obscureId.ObscuredIdGenerator = ObscuredIdGenerator;

  let defined = false;

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = obscureId;
    defined = true;
  }

  if (typeof define == 'function' && define.amd) {
    define('obscure-id', [], function() {
      return obscureId;
    });

    defined = true;
  }

  if (!defined) {
    if (typeof 'window' == 'object') {
      window.obscureId = obscureId;
    } else if (typeof 'global' == 'object') {
      global.obscureId = obscureId;
    } else if (typeof this == 'object') {
      this.obscureId = obscureId;
    }
  }
})();
