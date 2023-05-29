(() => {
  /**
   * Default function used for generating random numbers.
   */
  function defaultRandomFunction() {
    return Promise.resolve(Math.random());
  }

  /**
   * Generate two random integer numbers between 0 and base (exclusive).
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
    if (generator.prefixLength < 0) {
      throw new RangeError('invalid prefixLength');
    }

    if (generator.charset.length < 1) {
      throw new RangeError('invalid charset');
    }

    if (generator.key.length < 1) {
      throw new RangeError('invalid key');
    }
  }

  /**
   * @property {string} key
   * @property {string} charset
   * @property {number} defaultIdLength
   * @property {number} prefixLength
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
      this.charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      this.defaultIdLength = 8;
      this.prefixLength = 2;
      this.randomFunction = defaultRandomFunction;

      return this;
    }

    /**
     * Determine the maximum possible ID.
     *
     * @param {number} [length] Overwrite ID length to use.
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

      if (length - this.prefixLength <= 0) {
        throw new RangeError('invalid length');
      }

      const payloadLength = length - this.prefixLength;

      return this.charset.length ** payloadLength;
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

      if (length - this.prefixLength <= 0) {
        throw new RangeError('invalid length');
      }

      const base = this.charset.length;

      // payload length, excluding the random generated prefix
      const payloadLength = length - this.prefixLength;

      // calculate two random numbers
      const [r1, r2] = await generateRandomNumbers(base, random || this.randomFunction);

      // calculate single resulting number
      let r = r1 + r2 * base;

      let key = this.key;
      let keyLength = key.length;

      // shift start of key according to random number r
      key = key.substring(r % keyLength) + key.substring(0, (r % keyLength));

      // prepend random key to the key
      key = this.charset[r1] + this.charset[r2] + key;
      keyLength += this.prefixLength; // also count random digits

      // output, shift state
      let orderedPayload = '';
      let shift = 0;
      let digitIndex, ord;

      // while digits are still to be written
      for (let payloadIndex = 0; payloadIndex < payloadLength; ++payloadIndex) {
        digitIndex = (id + shift) % base;

        // output resulting digit
        orderedPayload += this.charset[digitIndex];

        // remove written digits from input
        id = Math.floor(id / base);

        // get current char from key and its order
        ord = key.charCodeAt(payloadIndex % keyLength);

        // calculate new shift value
        shift = (shift + digitIndex + ord) % base;
      }

      // randomize order
      let payloadDigit, outputPosition, i;
      let output = '\0'.repeat(payloadLength);

      // for each char in payload
      for (let payloadIndex = 0; payloadIndex < payloadLength; ++payloadIndex) {
        payloadDigit = orderedPayload[payloadIndex];
        i = r % (payloadLength - payloadIndex);
        r = Math.floor(r / (payloadLength - payloadIndex));

        // string position
        outputPosition = 0;

        // skip set digits
        while (output[outputPosition] && output[outputPosition] != '\0') {
          ++outputPosition;
        }

        for (let j = 0; j < i; ++j) {
          ++outputPosition;

          // skip set digits
          while (output[outputPosition] && output[outputPosition] != '\0') {
            ++outputPosition;
          }
        }

        if (outputPosition >= payloadLength) {
          return false;
        }

        output = output.substring(0, outputPosition) + payloadDigit + output.substring(outputPosition + 1);
      }

      // write random digits (prefix)
      output = this.charset[r1] + this.charset[r2] + output;

      return output;
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
        if (this.charset.indexOf(char) == -1) {
          throw new TypeError('"id" is invalid');
        }
      }

      const payloadLength = id.length - this.prefixLength;
      const base = this.charset.length;

      let key = this.key;

      let out = 0;
      let shift = 0;

      // unrandomize order
      let tmp = '';

      const r1 = id[0];
      const r2 = id[1];

      let r = this.charset.indexOf(r2) * base + this.charset.indexOf(r1);

      let keyLength = key.length;

      // shift start of key according to random number r
      key = key.substring(r % keyLength) + key.substring(0, (r % keyLength));

      key = r1 + r2 + key;
      keyLength += this.prefixLength;

      let unorderedPayload = id.substring(this.prefixLength);

      let payloadIndex, i, c, ord;

      // for each digit
      for (let payloadIndex = 0; payloadIndex < payloadLength; ++payloadIndex) {
        i = r % (payloadLength - payloadIndex);
        c = unorderedPayload[i];
        r = Math.floor(r / (payloadLength - payloadIndex));

        tmp += c;

        // remove digit
        unorderedPayload = unorderedPayload.substring(0, i) + unorderedPayload.substring(i + 1);
      }

      for (let n = 0; n < payloadLength; ++n) {
        r = tmp[n];
        i = this.charset.indexOf(r);
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
