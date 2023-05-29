# obscure-id

This project provides a small utility for numerical ID obscuration for public
display or referencing. It converts a number like *19* to a string like
*ivUVjy0Q*, and a given string (obscured ID) can be converted back to the
original number. The numerical number must be an integer of 1 or greater.
The maximum possible ID depends on the configuration.

One special feature of this function is, that a number can be converted to
several, various string values depending on random values, but each possible
string can be mapped to exactly one number.


## Example

~~~js
const obscureId = require('obscure-id');

// obscure numeric id
obscureId(19).then(obscuredId => {
  console.log('obscured id:', obscuredId);
});

// decode obscured id
obscureId('ivUVjy0Q').then(id => {
  console.log('id:', id);
});
~~~

Using a generator instance:

~~~js
const { ObscuredIdGenerator } = require('obscure-id');

const generator = new ObscuredIdGenerator();

// obscure numeric id
generator.generate(19).then(obscuredId => {
  console.log('obscured id:', obscuredId);
});

// decode obscured id
generator.decode('ivUVjy0Q').then(id => {
  console.log('id:', id);
});
~~~


## Platform Support

Platform | Support
-------- | -------
Node.js | 7.10.1+, 8.x and up
Chrome | 55+
Edge | Yes
Firefox | 52+
IE | No
Opera | 42+
Safari | 10.1+


## Installation and Usage

### Node.js

Using `npm`:

```sh
$ npm install --save obscure-id
```

Using `yarn`:

```sh
$ yarn add obscure-id
```

Now *require* that package in your code:

```js
const obscureId = require('obscure-id');
const { ObscuredIdGenerator } = require('obscure-id');

async main() {
  // using the plain function
  console.log(await obscureId(12));
  
  // using the generator class
  const generator = new ObscuredIdGenerator();
  console.log(await generator.generate(12));
}

main();
```


### Browser

Just download the `index.js`, rename it to `obscure-id.js` or whatever you like
and include it in your HTML file:

```html
<script src="obscure-id.js"></script>
<script>
async main() {
  // using the plain function
  console.log(await obscureId(12));
  
  // using the generator class
  const { ObscuredIdGenerator } = obscureId;
  const generator = new ObscuredIdGenerator();
  console.log(await generator.generate(12));
}
</script>
```

#### AMD

If you're using AMD, `obscureId` is not exported globally. You can access it like
this:

```js
define(['obscure-id'], async (obscureId) => {
  // using the plain function
  console.log(await obscureId(12));
  
  // using the generator class
  const { ObscuredIdGenerator } = obscureId;
  const generator = new ObscuredIdGenerator();
  console.log(await generator.generate(12));
});
```


## API

### `obscureId(id: number, length?: number, random?: number[] | Function)`

- **id:** the numerical ID to be encoded; must be >= 1
- **length:** desired length of output string
- **random:** either an array of numbers between 0 (inclusive) and 1 (exclusive),
or a function that returns a Promise that is resolved to such a number
- **returns:** `Promise<string>`

Generate an obscured id from a number.


### `obscureId(obscureId: string)`

- **returns:** `Promise<number>`

Convert an obscured ID back to number.


### `obscureId.configure(options: Object)`

Change the configuration. Only changes options, that are specified in the
parameter object.

```js
obscureId.configure({
  key: 'awesome',
  charset: 'abcdefghijklmnopqrstuvwxyz',
  defaultIdLength: 10
});
```

See Options below for more details.


### `obscureId.resetConfiguration()`

Reset options to the initial values.


### `ObscuredIdGenerator.constructor(options?: Object)`

Constructor for a new *ObscuredIdGenerator*. See Options below for possible
options.

```js
const generator = new ObscuredIdGenerator(options);
```


### `ObscuredIdGenerator#obscureId(id: number, length?: number, random?: number[] | Function)`

- **id:** the numerical ID to be encoded; must be >= 1
- **length:** desired length of output string
- **random:** either an array of numbers between 0 (inclusive) and 1 (exclusive),
or a function that returns a Promise that is resolved to such a number
- **returns:** `Promise<string>`

Generate an obscured id from a number.

- **alias:** `generate()`, `encode()`


### `ObscuredIdGenerator#obscureId(obscureId: string)`

- **returns:** `Promise<number>`

Convert an obscured ID back to number.

- **alias:** `decode()`


### `ObscuredIdGenerator#configure(options: Object)`

Change some configurations.

```js
generator.configure({
  key: 'awesome',
  charset: 'abcdefghijklmnopqrstuvwxyz',
  defaultIdLength: 10
});
```

See Options below for more details.


### `ObscuredIdGenerator#resetConfiguration()`

Reset options to the initial values.


### Options

- **key:** (string) the key, that is used to encode and decode the IDs. If you
change your key, all your generated obscured IDs become invalid.
- **charset:** (string) possible characters, that are used in the obscured IDs. If
you change your charset or change the order of the characters, all your generated
obscured IDs become invalid.
- **defaultIdLength:** (number, default 8) the output length of generated obscured
IDs, if no other length is specified by parameter.
- **prefixLength:** (number, default 2) number of characters within the
generated obscured ID, which indicates the random value of the output. If set to
0, every numerical ID corresponds to exactly one possible obscured ID. If you
change this value, all your generated obscured IDs become invalid.
- **randomFunction:** (function) a custom random number generator. Must return
a Promise, which resolves to a number between 0 (inclusive) and 1 (exclusive).


### Custom Random Function

By default, `Math.random()` is used to generate random values. If you need more
security, you can use a more secure random function like
`crypto.getRandomValues()` in the browser or the `crypto` module in Node.js.

```js
// in the browser
obscureId.configure({
  async randomFunction() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    
    return array[0] / (256 ** 4);
  }
});
```

```js
// in Node.js
const crypto = require('crypto');

obscureId.configure({
  randomFunction() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(1, (error, buffer) => {
        if(error) {
          return reject(error);
        }
        
        resolve(buffer[0] / 256);
      });
    });
  }
});
```


## Max ID

Depending on the raw output length (i.e. the total length minus the prefix
length) and the number of characters available there's a limit for the maximum
numerical ID that can be encoded. The following tables shows some sample
configurations and the maximum IDs:

Prefix | Length | Raw Length | Charset | Min ID | Max ID | Fits in
------ | ------ | ---------- | ------- | ------ | ------ | --------
2 | 8 | 6 | 62 (A-Z, a-z, 0-9) | 1 | 56800235584 | 5 bytes
2 | 8 | 6 | 26 (a-z) | 1 | 308915776 | 4 bytes
1 | 8 | 7 | 62 (A-Z, a-z, 0-9) | 1 | 3521614606208 | 6 bytes
4 | 12 | 8 | 62 (A-Z, a-z, 0-9) | 1 | 218340105584896 | 6 bytes
2 | 12 | 10 | 62 (A-Z, a-z, 0-9) | 1 | 839299365868340200 | 8 bytes

You can use the `maxId()` method to get the maximum ID possible using the
current configuration.


## License

obscure-id is licensed under the MIT License.
