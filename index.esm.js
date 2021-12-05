/*!
 * gmp-wasm v0.9.2 (https://www.npmjs.com/package/gmp-wasm)
 * (c) Dani Biro
 * @license LGPL-3.0
 */

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function isUint32(num) {
    return Number.isSafeInteger(num) && num >= 0 && num < Math.pow(2, 32);
}
function assertUint32(num) {
    if (!isUint32(num)) {
        throw new Error('Invalid number specified: uint32_t is required');
    }
}
function isInt32(num) {
    return Number.isSafeInteger(num) && num >= -Math.pow(2, 31) && num < Math.pow(2, 31);
}
function assertInt32(num) {
    if (!isInt32(num)) {
        throw new Error('Invalid number specified: int32_t is required');
    }
}
function assertArray(arr) {
    if (!Array.isArray(arr)) {
        throw new Error('Invalid parameter specified. Array is required!');
    }
}

const decoder$2 = new TextDecoder();
// matches mpfr_rnd_t
/** Represents the different rounding modes. */
var FloatRoundingMode;
(function (FloatRoundingMode) {
    /** Round to nearest, with ties to even. MPFR_RNDN */
    FloatRoundingMode[FloatRoundingMode["ROUND_NEAREST"] = 0] = "ROUND_NEAREST";
    /** Round toward zero. MPFR_RNDZ */
    FloatRoundingMode[FloatRoundingMode["ROUND_TO_ZERO"] = 1] = "ROUND_TO_ZERO";
    /** Round toward +Infinity. MPFR_RNDU */
    FloatRoundingMode[FloatRoundingMode["ROUND_UP"] = 2] = "ROUND_UP";
    /** Round toward -Infinity. MPFR_RNDD */
    FloatRoundingMode[FloatRoundingMode["ROUND_DOWN"] = 3] = "ROUND_DOWN";
    /** Round away from zero. MPFR_RNDA */
    FloatRoundingMode[FloatRoundingMode["ROUND_FROM_ZERO"] = 4] = "ROUND_FROM_ZERO";
    // /** (Experimental) Faithful rounding. MPFR_RNDF */
    // ROUND_FAITHFUL = 5,
    // /** (Experimental) Round to nearest, with ties away from zero. MPFR_RNDNA */
    // ROUND_TO_NEAREST_AWAY_FROM_ZERO = -1,
})(FloatRoundingMode || (FloatRoundingMode = {}));
const SPECIAL_VALUES = {
    '@NaN@': 'NaN',
    '@Inf@': 'Infinity',
    '-@Inf@': '-Infinity',
};
const SPECIAL_VALUE_KEYS = Object.keys(SPECIAL_VALUES);
const trimTrailingZeros = (num) => {
    let pos = num.length - 1;
    while (pos >= 0) {
        if (num[pos] === '.') {
            pos--;
            break;
        }
        else if (num[pos] === '0') {
            pos--;
        }
        else {
            break;
        }
    }
    if (pos !== num.length - 1) {
        return num.slice(0, pos + 1);
    }
    if (num.length === 0) {
        return '0';
    }
    return num;
};
const insertDecimalPoint = (mantissa, pointPos) => {
    const isNegative = mantissa.startsWith('-');
    const mantissaWithoutSign = isNegative ? mantissa.slice(1) : mantissa;
    const sign = isNegative ? '-' : '';
    let hasDecimalPoint = false;
    if (pointPos <= 0) {
        const zeros = '0'.repeat(-pointPos);
        mantissa = `${sign}0.${zeros}${mantissaWithoutSign}`;
        hasDecimalPoint = true;
    }
    else if (pointPos < mantissaWithoutSign.length) {
        mantissa = `${sign}${mantissaWithoutSign.slice(0, pointPos)}.${mantissaWithoutSign.slice(pointPos)}`;
        hasDecimalPoint = true;
    }
    else {
        const zeros = '0'.repeat(pointPos - mantissaWithoutSign.length);
        mantissa = `${mantissa}${zeros}`;
    }
    // trim trailing zeros after decimal point
    if (hasDecimalPoint) {
        mantissa = trimTrailingZeros(mantissa);
    }
    return mantissa;
};
const INVALID_PARAMETER_ERROR$2 = 'Invalid parameter!';
function getFloatContext(gmp, ctx, ctxOptions) {
    var _a, _b;
    const mpfr_t_arr = [];
    const isInteger = (val) => ctx.intContext.isInteger(val);
    const isRational = (val) => ctx.rationalContext.isRational(val);
    const isFloat = (val) => ctx.floatContext.isFloat(val);
    const globalRndMode = ((_a = ctxOptions.roundingMode) !== null && _a !== void 0 ? _a : FloatRoundingMode.ROUND_NEAREST);
    const globalPrecisionBits = (_b = ctxOptions.precisionBits) !== null && _b !== void 0 ? _b : 52;
    assertUint32(globalPrecisionBits);
    const compare = (mpfr_t, val) => {
        if (typeof val === 'number') {
            assertInt32(val);
            return gmp.mpfr_cmp_si(mpfr_t, val);
        }
        if (typeof val === 'string') {
            const f = FloatFn(val);
            return gmp.mpfr_cmp(mpfr_t, f.mpfr_t);
        }
        if (isInteger(val)) {
            return gmp.mpfr_cmp_z(mpfr_t, val.mpz_t);
        }
        if (isRational(val)) {
            return gmp.mpfr_cmp_q(mpfr_t, val.mpq_t);
        }
        if (isFloat(val)) {
            return gmp.mpfr_cmp(mpfr_t, val.mpfr_t);
        }
        throw new Error(INVALID_PARAMETER_ERROR$2);
    };
    const mergeFloatOptions = (options1, options2) => {
        var _a, _b, _c, _d;
        const precisionBits1 = (_a = options1 === null || options1 === void 0 ? void 0 : options1.precisionBits) !== null && _a !== void 0 ? _a : globalPrecisionBits;
        const precisionBits2 = (_b = options2 === null || options2 === void 0 ? void 0 : options2.precisionBits) !== null && _b !== void 0 ? _b : globalPrecisionBits;
        return {
            precisionBits: Math.max(precisionBits1, precisionBits2),
            roundingMode: (_d = (_c = options2 === null || options2 === void 0 ? void 0 : options2.roundingMode) !== null && _c !== void 0 ? _c : options1.roundingMode) !== null && _d !== void 0 ? _d : ctxOptions.roundingMode,
        };
    };
    const FloatPrototype = {
        mpfr_t: 0,
        precisionBits: -1,
        rndMode: -1,
        type: 'float',
        get options() {
            var _a, _b;
            return {
                precisionBits: (_a = this.precisionBits) !== null && _a !== void 0 ? _a : globalPrecisionBits,
                roundingMode: (_b = this.rndMode) !== null && _b !== void 0 ? _b : globalRndMode,
            };
        },
        get setOptions() {
            return {
                precisionBits: this.precisionBits,
                roundingMode: this.rndMode,
            };
        },
        /** Returns the sum of this number and the given one. */
        add(val) {
            if (typeof val === 'number') {
                const n = FloatFn(null, this.options);
                gmp.mpfr_add_d(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                return n;
            }
            if (typeof val === 'string') {
                const n = FloatFn(val, this.options);
                gmp.mpfr_add(n.mpfr_t, this.mpfr_t, n.mpfr_t, this.rndMode);
                return n;
            }
            if (isFloat(val)) {
                const n = FloatFn(null, mergeFloatOptions(this.setOptions, val.setOptions));
                gmp.mpfr_add(n.mpfr_t, this.mpfr_t, val.mpfr_t, this.rndMode);
                return n;
            }
            if (isRational(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_add_q(n.mpfr_t, this.mpfr_t, val.mpq_t, this.rndMode);
                return n;
            }
            if (isInteger(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_add_z(n.mpfr_t, this.mpfr_t, val.mpz_t, this.rndMode);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$2);
        },
        /** Returns the difference of this number and the given one. */
        sub(val) {
            if (typeof val === 'number') {
                const n = FloatFn(null, this.options);
                gmp.mpfr_sub_d(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                return n;
            }
            if (typeof val === 'string') {
                const n = FloatFn(val, this.options);
                gmp.mpfr_sub(n.mpfr_t, this.mpfr_t, n.mpfr_t, this.rndMode);
                return n;
            }
            if (isFloat(val)) {
                const n = FloatFn(null, mergeFloatOptions(this.setOptions, val.setOptions));
                gmp.mpfr_sub(n.mpfr_t, this.mpfr_t, val.mpfr_t, this.rndMode);
                return n;
            }
            if (isRational(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_sub_q(n.mpfr_t, this.mpfr_t, val.mpq_t, this.rndMode);
                return n;
            }
            if (isInteger(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_sub_z(n.mpfr_t, this.mpfr_t, val.mpz_t, this.rndMode);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$2);
        },
        /** Returns the product of this number and the given one. */
        mul(val) {
            if (typeof val === 'number') {
                const n = FloatFn(null, this.options);
                if (isInt32(val)) {
                    gmp.mpfr_mul_si(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                }
                else {
                    gmp.mpfr_mul_d(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                }
                return n;
            }
            if (typeof val === 'string') {
                const n = FloatFn(val, this.options);
                gmp.mpfr_mul(n.mpfr_t, this.mpfr_t, n.mpfr_t, this.rndMode);
                return n;
            }
            if (isFloat(val)) {
                const n = FloatFn(null, mergeFloatOptions(this.setOptions, val.setOptions));
                gmp.mpfr_mul(n.mpfr_t, this.mpfr_t, val.mpfr_t, this.rndMode);
                return n;
            }
            if (isRational(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_mul_q(n.mpfr_t, this.mpfr_t, val.mpq_t, this.rndMode);
                return n;
            }
            if (isInteger(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_mul_z(n.mpfr_t, this.mpfr_t, val.mpz_t, this.rndMode);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$2);
        },
        /** Returns the result of the division of this number by the given one. */
        div(val) {
            if (typeof val === 'number') {
                const n = FloatFn(null, this.options);
                gmp.mpfr_div_d(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                return n;
            }
            if (typeof val === 'string') {
                const n = FloatFn(val, this.options);
                gmp.mpfr_div(n.mpfr_t, this.mpfr_t, n.mpfr_t, this.rndMode);
                return n;
            }
            if (isFloat(val)) {
                const n = FloatFn(null, mergeFloatOptions(this.setOptions, val.setOptions));
                gmp.mpfr_div(n.mpfr_t, this.mpfr_t, val.mpfr_t, this.rndMode);
                return n;
            }
            if (isRational(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_div_q(n.mpfr_t, this.mpfr_t, val.mpq_t, this.rndMode);
                return n;
            }
            if (isInteger(val)) {
                const n = FloatFn(null, this.options);
                gmp.mpfr_div_z(n.mpfr_t, this.mpfr_t, val.mpz_t, this.rndMode);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$2);
        },
        /** Returns the integer square root number of this number. */
        sqrt() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_sqrt(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        invSqrt() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_rec_sqrt(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        cbrt() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_cbrt(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        nthRoot(nth) {
            const n = FloatFn(null, this.options);
            assertUint32(nth);
            gmp.mpfr_rootn_ui(n.mpfr_t, this.mpfr_t, nth, this.rndMode);
            return n;
        },
        /** Returns the number with inverted sign. */
        neg() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_neg(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Returns the absolute value of this number. */
        abs() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_abs(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        factorial() {
            const n = FloatFn(null, this.options);
            if (gmp.mpfr_fits_uint_p(this.mpfr_t, this.rndMode) === 0) {
                throw new Error('Invalid value for factorial()');
            }
            const value = gmp.mpfr_get_ui(this.mpfr_t, this.rndMode);
            gmp.mpfr_fac_ui(n.mpfr_t, value, this.rndMode);
            return n;
        },
        isInteger() {
            return gmp.mpfr_integer_p(this.mpfr_t) !== 0;
        },
        isZero() {
            return gmp.mpfr_zero_p(this.mpfr_t) !== 0;
        },
        isRegular() {
            return gmp.mpfr_regular_p(this.mpfr_t) !== 0;
        },
        isNumber() {
            return gmp.mpfr_number_p(this.mpfr_t) !== 0;
        },
        isInfinite() {
            return gmp.mpfr_inf_p(this.mpfr_t) !== 0;
        },
        isNaN() {
            return gmp.mpfr_nan_p(this.mpfr_t) !== 0;
        },
        isEqual(val) {
            return compare(this.mpfr_t, val) === 0;
        },
        lessThan(val) {
            return compare(this.mpfr_t, val) < 0;
        },
        lessOrEqual(val) {
            return compare(this.mpfr_t, val) <= 0;
        },
        greaterThan(val) {
            return compare(this.mpfr_t, val) > 0;
        },
        greaterOrEqual(val) {
            return compare(this.mpfr_t, val) >= 0;
        },
        ln() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_log(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        log2() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_log2(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        log10() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_log10(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        exp() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_exp(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        exp2() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_exp2(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        exp10() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_exp10(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Returns this number exponentiated to the given value. */
        pow(val) {
            const n = FloatFn(null, this.options);
            if (typeof val === 'number') {
                if (isInt32(val)) {
                    gmp.mpfr_pow_si(n.mpfr_t, this.mpfr_t, val, this.rndMode);
                }
                else {
                    gmp.mpfr_pow(n.mpfr_t, this.mpfr_t, FloatFn(val).mpfr_t, this.rndMode);
                }
            }
            else {
                gmp.mpfr_pow(n.mpfr_t, this.mpfr_t, val.mpfr_t, this.rndMode);
            }
            return n;
        },
        sin() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_sin(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        cos() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_cos(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        tan() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_tan(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        sec() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_sec(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        csc() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_csc(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        cot() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_cot(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        acos() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_acos(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        asin() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_asin(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        atan() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_atan(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        sinh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_sinh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        cosh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_cosh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        tanh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_tanh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        sech() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_sech(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        csch() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_csch(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        coth() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_coth(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        acosh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_acosh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        asinh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_asinh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        atanh() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_atanh(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate exponential integral */
        eint() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_eint(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_li2(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the Gamma function. */
        gamma() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_gamma(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_lngamma(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_digamma(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the Beta function */
        beta(op2) {
            if (!isFloat(op2)) {
                throw new Error('Only floats parameters are supported!');
            }
            const n = FloatFn(null, this.options);
            gmp.mpfr_beta(n.mpfr_t, this.mpfr_t, op2.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the Riemann Zeta function */
        zeta() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_zeta(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the error function */
        erf() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_erf(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the complementary error function */
        erfc() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_erfc(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_j0(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_j1(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n) {
            assertInt32(n);
            const rop = FloatFn(null, this.options);
            gmp.mpfr_jn(rop.mpfr_t, n, this.mpfr_t, this.rndMode);
            return rop;
        },
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_y0(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_y1(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n) {
            assertInt32(n);
            const rop = FloatFn(null, this.options);
            gmp.mpfr_yn(rop.mpfr_t, n, this.mpfr_t, this.rndMode);
            return rop;
        },
        /** Calculate the arithmetic-geometric mean */
        agm(op2) {
            if (!isFloat(op2)) {
                throw new Error('Only floats parameters are supported!');
            }
            const n = FloatFn(null, this.options);
            gmp.mpfr_agm(n.mpfr_t, this.mpfr_t, op2.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of the Airy function Ai on x */
        ai() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_ai(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        sign() {
            return gmp.mpfr_sgn(this.mpfr_t);
        },
        toNumber() {
            return gmp.mpfr_get_d(this.mpfr_t, this.rndMode);
        },
        /** Rounds to the next higher or equal representable integer */
        ceil() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_ceil(n.mpfr_t, this.mpfr_t);
            return n;
        },
        /** Rounds to the next lower or equal representable integer */
        floor() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_floor(n.mpfr_t, this.mpfr_t);
            return n;
        },
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_round(n.mpfr_t, this.mpfr_t);
            return n;
        },
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_roundeven(n.mpfr_t, this.mpfr_t);
            return n;
        },
        /** Rounds to the next representable integer toward zero */
        trunc() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_trunc(n.mpfr_t, this.mpfr_t);
            return n;
        },
        /** Round to precision */
        roundTo(prec) {
            assertUint32(prec);
            const n = FloatFn(this, this.options);
            gmp.mpfr_prec_round(this.mpfr_t, prec, this.rndMode);
            return n;
        },
        /** Returns the fractional part */
        frac() {
            const n = FloatFn(null, this.options);
            gmp.mpfr_frac(n.mpfr_t, this.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y) {
            if (!isFloat(y)) {
                throw new Error('Only floats parameters are supported!');
            }
            const n = FloatFn(null, this.options);
            gmp.mpfr_fmod(n.mpfr_t, this.mpfr_t, y.mpfr_t, this.rndMode);
            return n;
        },
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y) {
            if (!isFloat(y)) {
                throw new Error('Only floats parameters are supported!');
            }
            const n = FloatFn(null, this.options);
            gmp.mpfr_remainder(n.mpfr_t, this.mpfr_t, y.mpfr_t, this.rndMode);
            return n;
        },
        nextAbove() {
            const n = FloatFn(this, this.options);
            gmp.mpfr_nextabove(n.mpfr_t);
            return n;
        },
        nextBelow() {
            const n = FloatFn(this, this.options);
            gmp.mpfr_nextbelow(n.mpfr_t);
            return n;
        },
        exponent2() {
            return gmp.mpfr_get_exp(this.mpfr_t);
        },
        toString() {
            const mpfr_exp_t_ptr = gmp.malloc(4);
            const strptr = gmp.mpfr_get_str(0, mpfr_exp_t_ptr, 10, 0, this.mpfr_t, this.rndMode);
            const endptr = gmp.mem.indexOf(0, strptr);
            let ret = decoder$2.decode(gmp.mem.subarray(strptr, endptr));
            if (SPECIAL_VALUE_KEYS.includes(ret)) {
                ret = SPECIAL_VALUES[ret];
            }
            else {
                // decimal point needs to be inserted
                const pointPos = gmp.memView.getInt32(mpfr_exp_t_ptr, true);
                ret = insertDecimalPoint(ret, pointPos);
            }
            gmp.mpfr_free_str(strptr);
            gmp.free(mpfr_exp_t_ptr);
            return ret;
        },
        toFixed(digits = 0) {
            assertUint32(digits);
            const str = this.toString();
            if (Object.values(SPECIAL_VALUES).includes(str)) {
                return str;
            }
            if (digits === 0) {
                return ctx.intContext.Integer(this).toString();
            }
            const multiplied = this.mul(FloatFn(digits).exp10());
            const int = ctx.intContext.Integer(multiplied);
            const isNegative = int.sign() === -1;
            let intStr = int.abs().toString();
            if (intStr.length < digits + 1) {
                intStr = '0'.repeat(digits + 1 - intStr.length) + intStr;
            }
            return `${isNegative ? '-' : ''}${intStr.slice(0, -digits)}.${intStr.slice(-digits)}`;
        },
        toInteger() {
            return ctx.intContext.Integer(this);
        },
        toRational() {
            return ctx.rationalContext.Rational(this);
        },
    };
    const setValue = (mpfr_t, rndMode, val) => {
        if (typeof val === 'string') {
            const strPtr = gmp.malloc_cstr(val);
            gmp.mpfr_set_str(mpfr_t, strPtr, 10, rndMode);
            gmp.free(strPtr);
            return;
        }
        if (typeof val === 'number') {
            if (isInt32(val)) {
                gmp.mpfr_set_si(mpfr_t, val, rndMode);
                if (Object.is(val, -0)) {
                    gmp.mpfr_neg(mpfr_t, mpfr_t, rndMode);
                }
            }
            else {
                gmp.mpfr_set_d(mpfr_t, val, rndMode);
            }
            return;
        }
        if (isFloat(val)) {
            gmp.mpfr_set(mpfr_t, val.mpfr_t, rndMode);
            return;
        }
        if (isRational(val)) {
            gmp.mpfr_set_q(mpfr_t, val.mpq_t, rndMode);
            return;
        }
        if (isInteger(val)) {
            gmp.mpfr_set_z(mpfr_t, val.mpz_t, rndMode);
            return;
        }
        throw new Error(INVALID_PARAMETER_ERROR$2);
    };
    const FloatFn = (val, options) => {
        var _a, _b;
        const rndMode = ((_a = options === null || options === void 0 ? void 0 : options.roundingMode) !== null && _a !== void 0 ? _a : globalRndMode);
        const precisionBits = (_b = options === null || options === void 0 ? void 0 : options.precisionBits) !== null && _b !== void 0 ? _b : globalPrecisionBits;
        const instance = Object.create(FloatPrototype);
        instance.rndMode = rndMode;
        instance.precisionBits = precisionBits;
        instance.mpfr_t = gmp.mpfr_t();
        gmp.mpfr_init2(instance.mpfr_t, precisionBits);
        if (val !== undefined && val !== null) {
            setValue(instance.mpfr_t, rndMode, val);
        }
        mpfr_t_arr.push(instance.mpfr_t);
        return instance;
    };
    return {
        Float: FloatFn,
        isFloat: (val) => FloatPrototype.isPrototypeOf(val),
        Pi: (options) => {
            var _a;
            const n = FloatFn(null, options);
            gmp.mpfr_const_pi(n.mpfr_t, ((_a = options === null || options === void 0 ? void 0 : options.roundingMode) !== null && _a !== void 0 ? _a : globalRndMode));
            return n;
        },
        EulerConstant: (options) => {
            var _a;
            const n = FloatFn(null, options);
            gmp.mpfr_const_euler(n.mpfr_t, ((_a = options === null || options === void 0 ? void 0 : options.roundingMode) !== null && _a !== void 0 ? _a : globalRndMode));
            return n;
        },
        EulerNumber: (options) => {
            return FloatFn(1, options).exp();
        },
        Log2: (options) => {
            var _a;
            const n = FloatFn(null, options);
            gmp.mpfr_const_log2(n.mpfr_t, ((_a = options === null || options === void 0 ? void 0 : options.roundingMode) !== null && _a !== void 0 ? _a : globalRndMode));
            return n;
        },
        Catalan: (options) => {
            var _a;
            const n = FloatFn(null, options);
            gmp.mpfr_const_catalan(n.mpfr_t, ((_a = options === null || options === void 0 ? void 0 : options.roundingMode) !== null && _a !== void 0 ? _a : globalRndMode));
            return n;
        },
        destroy: () => {
            for (let i = mpfr_t_arr.length - 1; i >= 0; i--) {
                gmp.mpfr_clear(mpfr_t_arr[i]);
                gmp.mpfr_t_free(mpfr_t_arr[i]);
            }
            mpfr_t_arr.length = 0;
        }
    };
}

// DEFLATE is a complex format; to read this code, you should probably check the RFC first:

// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
// see fleb note
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new u32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return [b, r];
};
var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b[0];
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i)
        ++l[cd[i] - 1];
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 0; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >>> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    var n = new (v instanceof u16 ? u16 : v instanceof u32 ? u32 : u8)(e - s);
    n.set(v.subarray(s, e));
    return n;
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    ,
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, buf, st) {
    // source length
    var sl = dat.length;
    if (!sl || (st && st.f && !st.l))
        return buf || new u8(0);
    // have to estimate size
    var noBuf = !buf || st;
    // no state
    var noSt = !st || st.i;
    if (!st)
        st = {};
    // Assumes roughly 33% compression ratio average
    if (!buf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (noBuf)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >>> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17;
        if (noBuf)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (noBuf)
                    cbuf(bt + 131072);
                var end = bt + add;
                for (; bt < end; bt += 4) {
                    buf[bt] = buf[bt - dt];
                    buf[bt + 1] = buf[bt + 1 - dt];
                    buf[bt + 2] = buf[bt + 2 - dt];
                    buf[bt + 3] = buf[bt + 3 - dt];
                }
                bt = end;
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt == buf.length ? buf : slc(buf, 0, bt);
};
// empty
var et = /*#__PURE__*/ new u8(0);
/**
 * Expands DEFLATE data with no wrapper
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
function inflateSync(data, out) {
    return inflt(data, out);
}
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
    base64Lookup[base64Chars.charCodeAt(i)] = i;
}
function getDecodeBase64Length(data) {
    let bufferLength = Math.floor(data.length * 0.75);
    const len = data.length;
    if (data[len - 1] === '=') {
        bufferLength -= 1;
        if (data[len - 2] === '=') {
            bufferLength -= 1;
        }
    }
    return bufferLength;
}
function decodeBase64(data) {
    const bufferLength = getDecodeBase64Length(data);
    const len = data.length;
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const encoded1 = base64Lookup[data.charCodeAt(i)];
        const encoded2 = base64Lookup[data.charCodeAt(i + 1)];
        const encoded3 = base64Lookup[data.charCodeAt(i + 2)];
        const encoded4 = base64Lookup[data.charCodeAt(i + 3)];
        bytes[p] = (encoded1 << 2) | (encoded2 >> 4);
        p += 1;
        bytes[p] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        p += 1;
        bytes[p] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        p += 1;
    }
    return bytes;
}

const gmpWasmLength = 561289;
const gmpWasm = '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';

let instance = null;
let compiledModule = null;
const decompressAndCompile = () => __awaiter(void 0, void 0, void 0, function* () {
    if (compiledModule)
        return;
    // console.time('decompress');
    const decoded = decodeBase64(gmpWasm);
    const decompressed = new Uint8Array(gmpWasmLength);
    inflateSync(decoded, decompressed);
    // console.timeEnd('decompress');
    // console.time('compile');
    compiledModule = yield WebAssembly.compile(decompressed);
    // console.timeEnd('compile');
});
const getBinding = (reset = false) => __awaiter(void 0, void 0, void 0, function* () {
    if (!reset && instance !== null) {
        return instance;
    }
    if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this environment!');
    }
    yield decompressAndCompile();
    let heap = { HEAP8: null };
    const errorHandler = () => {
        throw new Error('Fatal error in gmp-wasm');
    };
    const wasmInstance = yield WebAssembly.instantiate(compiledModule, {
        env: {
            emscripten_notify_memory_growth: () => {
                heap.HEAP8 = new Uint8Array(wasmInstance.exports.memory.buffer);
            },
        },
        wasi_snapshot_preview1: {
            proc_exit: errorHandler,
            fd_write: errorHandler,
            fd_seek: errorHandler,
            fd_close: errorHandler,
        },
    });
    const exports = wasmInstance.exports;
    exports._initialize();
    heap.HEAP8 = new Uint8Array(wasmInstance.exports.memory.buffer);
    instance = Object.assign({ heap }, exports);
    return instance;
});

var mpfr_rnd_t;
(function (mpfr_rnd_t) {
    /** Round to nearest, with ties to even */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDN"] = 0] = "MPFR_RNDN";
    /** Round toward zero */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDZ"] = 1] = "MPFR_RNDZ";
    /** Round toward +Inf */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDU"] = 2] = "MPFR_RNDU";
    /** Round toward -Inf */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDD"] = 3] = "MPFR_RNDD";
    /** Round away from zero */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDA"] = 4] = "MPFR_RNDA";
    /** (Experimental) Faithful rounding */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDF"] = 5] = "MPFR_RNDF";
    /** (Experimental) Round to nearest, with ties away from zero (mpfr_round) */
    mpfr_rnd_t[mpfr_rnd_t["MPFR_RNDNA"] = -1] = "MPFR_RNDNA";
})(mpfr_rnd_t || (mpfr_rnd_t = {}));
var mpfr_flags;
(function (mpfr_flags) {
    mpfr_flags[mpfr_flags["MPFR_FLAGS_UNDERFLOW"] = 1] = "MPFR_FLAGS_UNDERFLOW";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_OVERFLOW"] = 2] = "MPFR_FLAGS_OVERFLOW";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_NAN"] = 4] = "MPFR_FLAGS_NAN";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_INEXACT"] = 8] = "MPFR_FLAGS_INEXACT";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_ERANGE"] = 16] = "MPFR_FLAGS_ERANGE";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_DIVBY0"] = 32] = "MPFR_FLAGS_DIVBY0";
    mpfr_flags[mpfr_flags["MPFR_FLAGS_ALL"] = 63] = "MPFR_FLAGS_ALL";
})(mpfr_flags || (mpfr_flags = {}));
var mpfr_free_cache_t;
(function (mpfr_free_cache_t) {
    mpfr_free_cache_t[mpfr_free_cache_t["MPFR_FREE_LOCAL_CACHE"] = 1] = "MPFR_FREE_LOCAL_CACHE";
    mpfr_free_cache_t[mpfr_free_cache_t["MPFR_FREE_GLOBAL_CACHE"] = 2] = "MPFR_FREE_GLOBAL_CACHE"; /* 1 << 1 */
})(mpfr_free_cache_t || (mpfr_free_cache_t = {}));
const encoder = new TextEncoder();
function getGMPInterface() {
    return __awaiter(this, void 0, void 0, function* () {
        let gmp = yield getBinding();
        return {
            reset: () => __awaiter(this, void 0, void 0, function* () { gmp = yield getBinding(true); }),
            malloc: (size) => gmp.g_malloc(size),
            malloc_cstr: (str) => {
                const buf = encoder.encode(str);
                const ptr = gmp.g_malloc(buf.length + 1);
                gmp.heap.HEAP8.set(buf, ptr);
                gmp.heap.HEAP8[ptr + buf.length] = 0;
                return ptr;
            },
            free: (ptr) => gmp.g_free(ptr),
            get mem() { return gmp.heap.HEAP8; },
            get memView() { return new DataView(gmp.heap.HEAP8.buffer, gmp.heap.HEAP8.byteOffset, gmp.heap.HEAP8.byteLength); },
            /**************** Random number routines.  ****************/
            /** Initialize state with a default algorithm. */
            gmp_randinit_default: (state) => { gmp.g_randinit_default(state); },
            /** Initialize state with a linear congruential algorithm X = (aX + c) mod 2^m2exp. */
            gmp_randinit_lc_2exp: (state, a, c, m2exp) => { gmp.g_randinit_lc_2exp(state, a, c, m2exp); },
            /** Initialize state for a linear congruential algorithm as per gmp_randinit_lc_2exp. */
            gmp_randinit_lc_2exp_size: (state, size) => { return gmp.g_randinit_lc_2exp_size(state, size); },
            /** Initialize state for a Mersenne Twister algorithm. */
            gmp_randinit_mt: (state) => { gmp.g_randinit_mt(state); },
            /** Initialize rop with a copy of the algorithm and state from op. */
            gmp_randinit_set: (rop, op) => { gmp.g_randinit_set(rop, op); },
            /** Set an initial seed value into state. */
            gmp_randseed: (state, seed) => { gmp.g_randseed(state, seed); },
            /** Set an initial seed value into state. */
            gmp_randseed_ui: (state, seed) => { gmp.g_randseed_ui(state, seed); },
            /** Free all memory occupied by state. */
            gmp_randclear: (state) => { gmp.g_randclear(state); },
            /** Generate a uniformly distributed random number of n bits, i.e. in the range 0 to 2^n - 1 inclusive. */
            gmp_urandomb_ui: (state, n) => { return gmp.g_urandomb_ui(state, n); },
            /** Generate a uniformly distributed random number in the range 0 to n - 1, inclusive. */
            gmp_urandomm_ui: (state, n) => { return gmp.g_urandomm_ui(state, n); },
            /**************** Formatted output routines.  ****************/
            /**************** Formatted input routines.  ****************/
            /**************** Integer (i.e. Z) routines.  ****************/
            /** Get GMP limb size */
            mp_bits_per_limb: () => gmp.z_limb_size(),
            /** Allocates memory for the mpfr_t C struct and returns pointer */
            mpz_t: () => gmp.z_t(),
            /** Deallocates memory of a mpfr_t C struct */
            mpz_t_free: (ptr) => { gmp.z_t_free(ptr); },
            /** Deallocates memory of a NULL-terminated list of mpfr_t variables */
            mpz_t_frees: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.z_t_free(ptrs[i]);
                }
            },
            /** Set rop to the absolute value of op. */
            mpz_abs: (rop, op) => { gmp.z_abs(rop, op); },
            /** Set rop to op1 + op2. */
            mpz_add: (rop, op1, op2) => { gmp.z_add(rop, op1, op2); },
            /** Set rop to op1 + op2. */
            mpz_add_ui: (rop, op1, op2) => { gmp.z_add_ui(rop, op1, op2); },
            /** Set rop to rop + op1 * op2. */
            mpz_addmul: (rop, op1, op2) => { gmp.z_addmul(rop, op1, op2); },
            /** Set rop to rop + op1 * op2. */
            mpz_addmul_ui: (rop, op1, op2) => { gmp.z_addmul_ui(rop, op1, op2); },
            /** Set rop to op1 bitwise-and op2. */
            mpz_and: (rop, op1, op2) => { gmp.z_and(rop, op1, op2); },
            /** Compute the binomial coefficient n over k and store the result in rop. */
            mpz_bin_ui: (rop, n, k) => { gmp.z_bin_ui(rop, n, k); },
            /** Compute the binomial coefficient n over k and store the result in rop. */
            mpz_bin_uiui: (rop, n, k) => { gmp.z_bin_uiui(rop, n, k); },
            /** Set the quotient q to ceiling(n / d). */
            mpz_cdiv_q: (q, n, d) => { gmp.z_cdiv_q(q, n, d); },
            /** Set the quotient q to ceiling(n / 2^b). */
            mpz_cdiv_q_2exp: (q, n, b) => { gmp.z_cdiv_q_2exp(q, n, b); },
            /** Set the quotient q to ceiling(n / d), and return the remainder r = | n - q * d |. */
            mpz_cdiv_q_ui: (q, n, d) => gmp.z_cdiv_q_ui(q, n, d),
            /** Set the quotient q to ceiling(n / d), and set the remainder r to n - q * d. */
            mpz_cdiv_qr: (q, r, n, d) => { gmp.z_cdiv_qr(q, r, n, d); },
            /** Set quotient q to ceiling(n / d), set the remainder r to n - q * d, and return | r |. */
            mpz_cdiv_qr_ui: (q, r, n, d) => gmp.z_cdiv_qr_ui(q, r, n, d),
            /** Set the remainder r to n - q * d where q = ceiling(n / d). */
            mpz_cdiv_r: (r, n, d) => { gmp.z_cdiv_r(r, n, d); },
            /** Set the remainder r to n - q * 2^b where q = ceiling(n / 2^b). */
            mpz_cdiv_r_2exp: (r, n, b) => { gmp.z_cdiv_r_2exp(r, n, b); },
            /** Set the remainder r to n - q * d where q = ceiling(n / d), and return | r |. */
            mpz_cdiv_r_ui: (r, n, d) => gmp.z_cdiv_r_ui(r, n, d),
            /** Return the remainder | r | where r = n - q * d, and where q = ceiling(n / d). */
            mpz_cdiv_ui: (n, d) => gmp.z_cdiv_ui(n, d),
            /** Free the space occupied by x. */
            mpz_clear: (x) => { gmp.z_clear(x); },
            /** Free the space occupied by a NULL-terminated list of mpz_t variables. */
            mpz_clears: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.z_clear(ptrs[i]);
                }
            },
            /** Clear bit bit_index in rop. */
            mpz_clrbit: (rop, bit_index) => { gmp.z_clrbit(rop, bit_index); },
            /** Compare op1 and op2. */
            mpz_cmp: (op1, op2) => gmp.z_cmp(op1, op2),
            /** Compare op1 and op2. */
            mpz_cmp_d: (op1, op2) => gmp.z_cmp_d(op1, op2),
            /** Compare op1 and op2. */
            mpz_cmp_si: (op1, op2) => gmp.z_cmp_si(op1, op2),
            /** Compare op1 and op2. */
            mpz_cmp_ui: (op1, op2) => gmp.z_cmp_ui(op1, op2),
            /** Compare the absolute values of op1 and op2. */
            mpz_cmpabs: (op1, op2) => gmp.z_cmpabs(op1, op2),
            /** Compare the absolute values of op1 and op2. */
            mpz_cmpabs_d: (op1, op2) => gmp.z_cmpabs_d(op1, op2),
            /** Compare the absolute values of op1 and op2. */
            mpz_cmpabs_ui: (op1, op2) => gmp.z_cmpabs_ui(op1, op2),
            /** Set rop to the one’s complement of op. */
            mpz_com: (rop, op) => { gmp.z_com(rop, op); },
            /** Complement bit bitIndex in rop. */
            mpz_combit: (rop, bitIndex) => { gmp.z_combit(rop, bitIndex); },
            /** Return non-zero if n is congruent to c modulo d. */
            mpz_congruent_p: (n, c, d) => gmp.z_congruent_p(n, c, d),
            /** Return non-zero if n is congruent to c modulo 2^b. */
            mpz_congruent_2exp_p: (n, c, b) => gmp.z_congruent_2exp_p(n, c, b),
            /** Return non-zero if n is congruent to c modulo d. */
            mpz_congruent_ui_p: (n, c, d) => gmp.z_congruent_ui_p(n, c, d),
            /** Set q to n / d when it is known in advance that d divides n. */
            mpz_divexact: (q, n, d) => { gmp.z_divexact(q, n, d); },
            /** Set q to n / d when it is known in advance that d divides n. */
            mpz_divexact_ui: (q, n, d) => { gmp.z_divexact_ui(q, n, d); },
            /** Return non-zero if n is exactly divisible by d. */
            mpz_divisible_p: (n, d) => gmp.z_divisible_p(n, d),
            /** Return non-zero if n is exactly divisible by d. */
            mpz_divisible_ui_p: (n, d) => gmp.z_divisible_ui_p(n, d),
            /** Return non-zero if n is exactly divisible by 2^b. */
            mpz_divisible_2exp_p: (n, b) => gmp.z_divisible_2exp_p(n, b),
            /** Determine whether op is even. */
            mpz_even_p: (op) => { gmp.z_even_p(op); },
            /** Fill rop with word data from op. */
            mpz_export: (rop, countp, order, size, endian, nails, op) => gmp.z_export(rop, countp, order, size, endian, nails, op),
            /** Set rop to the factorial n!. */
            mpz_fac_ui: (rop, n) => { gmp.z_fac_ui(rop, n); },
            /** Set rop to the double-factorial n!!. */
            mpz_2fac_ui: (rop, n) => { gmp.z_2fac_ui(rop, n); },
            /** Set rop to the m-multi-factorial n!^(m)n. */
            mpz_mfac_uiui: (rop, n, m) => { gmp.z_mfac_uiui(rop, n, m); },
            /** Set rop to the primorial of n, i.e. the product of all positive prime numbers ≤ n. */
            mpz_primorial_ui: (rop, n) => { gmp.z_primorial_ui(rop, n); },
            /** Set the quotient q to floor(n / d). */
            mpz_fdiv_q: (q, n, d) => { gmp.z_fdiv_q(q, n, d); },
            /** Set the quotient q to floor(n / 2^b). */
            mpz_fdiv_q_2exp: (q, n, b) => { gmp.z_fdiv_q_2exp(q, n, b); },
            /** Set the quotient q to floor(n / d), and return the remainder r = | n - q * d |. */
            mpz_fdiv_q_ui: (q, n, d) => gmp.z_fdiv_q_ui(q, n, d),
            /** Set the quotient q to floor(n / d), and set the remainder r to n - q * d. */
            mpz_fdiv_qr: (q, r, n, d) => { gmp.z_fdiv_qr(q, r, n, d); },
            /** Set quotient q to floor(n / d), set the remainder r to n - q * d, and return | r |. */
            mpz_fdiv_qr_ui: (q, r, n, d) => gmp.z_fdiv_qr_ui(q, r, n, d),
            /** Set the remainder r to n - q * d where q = floor(n / d). */
            mpz_fdiv_r: (r, n, d) => { gmp.z_fdiv_r(r, n, d); },
            /** Set the remainder r to n - q * 2^b where q = floor(n / 2^b). */
            mpz_fdiv_r_2exp: (r, n, b) => { gmp.z_fdiv_r_2exp(r, n, b); },
            /** Set the remainder r to n - q * d where q = floor(n / d), and return | r |. */
            mpz_fdiv_r_ui: (r, n, d) => gmp.z_fdiv_r_ui(r, n, d),
            /** Return the remainder | r | where r = n - q * d, and where q = floor(n / d). */
            mpz_fdiv_ui: (n, d) => gmp.z_fdiv_ui(n, d),
            /** Sets fn to to F[n], the n’th Fibonacci number. */
            mpz_fib_ui: (fn, n) => { gmp.z_fib_ui(fn, n); },
            /** Sets fn to F[n], and fnsub1 to F[n - 1]. */
            mpz_fib2_ui: (fn, fnsub1, n) => { gmp.z_fib2_ui(fn, fnsub1, n); },
            /** Return non-zero iff the value of op fits in a signed 32-bit integer. Otherwise, return zero. */
            mpz_fits_sint_p: (op) => gmp.z_fits_sint_p(op),
            /** Return non-zero iff the value of op fits in a signed 32-bit integer. Otherwise, return zero. */
            mpz_fits_slong_p: (op) => gmp.z_fits_slong_p(op),
            /** Return non-zero iff the value of op fits in a signed 16-bit integer. Otherwise, return zero. */
            mpz_fits_sshort_p: (op) => gmp.z_fits_sshort_p(op),
            /** Return non-zero iff the value of op fits in an unsigned 32-bit integer. Otherwise, return zero. */
            mpz_fits_uint_p: (op) => gmp.z_fits_uint_p(op),
            /** Return non-zero iff the value of op fits in an unsigned 32-bit integer. Otherwise, return zero. */
            mpz_fits_ulong_p: (op) => gmp.z_fits_ulong_p(op),
            /** Return non-zero iff the value of op fits in an unsigned 16-bit integer. Otherwise, return zero. */
            mpz_fits_ushort_p: (op) => gmp.z_fits_ushort_p(op),
            /** Set rop to the greatest common divisor of op1 and op2. */
            mpz_gcd: (rop, op1, op2) => { gmp.z_gcd(rop, op1, op2); },
            /** Compute the greatest common divisor of op1 and op2. If rop is not null, store the result there. */
            mpz_gcd_ui: (rop, op1, op2) => gmp.z_gcd_ui(rop, op1, op2),
            /** Set g to the greatest common divisor of a and b, and in addition set s and t to coefficients satisfying a * s + b * t = g. */
            mpz_gcdext: (g, s, t, a, b) => { gmp.z_gcdext(g, s, t, a, b); },
            /** Convert op to a double, truncating if necessary (i.e. rounding towards zero). */
            mpz_get_d: (op) => gmp.z_get_d(op),
            /** Convert op to a double, truncating if necessary (i.e. rounding towards zero), and returning the exponent separately. */
            mpz_get_d_2exp: (exp, op) => gmp.z_get_d_2exp(exp, op),
            /** Return the value of op as an signed long. */
            mpz_get_si: (op) => gmp.z_get_si(op),
            /** Convert op to a string of digits in base base. */
            mpz_get_str: (str, base, op) => gmp.z_get_str(str, base, op),
            /** Return the value of op as an unsigned long. */
            mpz_get_ui: (op) => gmp.z_get_ui(op),
            /** Return limb number n from op. */
            mpz_getlimbn: (op, n) => gmp.z_getlimbn(op, n),
            /** Return the hamming distance between the two operands. */
            mpz_hamdist: (op1, op2) => gmp.z_hamdist(op1, op2),
            /** Set rop from an array of word data at op. */
            mpz_import: (rop, count, order, size, endian, nails, op) => { gmp.z_import(rop, count, order, size, endian, nails, op); },
            /** Initialize x, and set its value to 0. */
            mpz_init: (x) => { gmp.z_init(x); },
            /** Initialize a NULL-terminated list of mpz_t variables, and set their values to 0. */
            mpz_inits: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.z_init(ptrs[i]);
                }
            },
            /** Initialize x, with space for n-bit numbers, and set its value to 0. */
            mpz_init2: (x, n) => { gmp.z_init2(x, n); },
            /** Initialize rop with limb space and set the initial numeric value from op. */
            mpz_init_set: (rop, op) => { gmp.z_init_set(rop, op); },
            /** Initialize rop with limb space and set the initial numeric value from op. */
            mpz_init_set_d: (rop, op) => { gmp.z_init_set_d(rop, op); },
            /** Initialize rop with limb space and set the initial numeric value from op. */
            mpz_init_set_si: (rop, op) => { gmp.z_init_set_si(rop, op); },
            /** Initialize rop and set its value like mpz_set_str. */
            mpz_init_set_str: (rop, str, base) => gmp.z_init_set_str(rop, str, base),
            /** Initialize rop with limb space and set the initial numeric value from op. */
            mpz_init_set_ui: (rop, op) => { gmp.z_init_set_ui(rop, op); },
            /** Compute the inverse of op1 modulo op2 and put the result in rop. */
            mpz_invert: (rop, op1, op2) => gmp.z_invert(rop, op1, op2),
            /** Set rop to op1 bitwise inclusive-or op2. */
            mpz_ior: (rop, op1, op2) => { gmp.z_ior(rop, op1, op2); },
            /** Calculate the Jacobi symbol (a/b). */
            mpz_jacobi: (a, b) => gmp.z_jacobi(a, b),
            /** Calculate the Jacobi symbol (a/b) with the Kronecker extension (a/2) = (2/a) when a odd, or (a/2) = 0 when a even. */
            mpz_kronecker: (a, b) => gmp.z_kronecker(a, b),
            /** Calculate the Jacobi symbol (a/b) with the Kronecker extension (a/2) = (2/a) when a odd, or (a/2) = 0 when a even. */
            mpz_kronecker_si: (a, b) => gmp.z_kronecker_si(a, b),
            /** Calculate the Jacobi symbol (a/b) with the Kronecker extension (a/2) = (2/a) when a odd, or (a/2) = 0 when a even. */
            mpz_kronecker_ui: (a, b) => gmp.z_kronecker_ui(a, b),
            /** Calculate the Jacobi symbol (a/b) with the Kronecker extension (a/2) = (2/a) when a odd, or (a/2) = 0 when a even. */
            mpz_si_kronecker: (a, b) => gmp.z_si_kronecker(a, b),
            /** Calculate the Jacobi symbol (a/b) with the Kronecker extension (a/2) = (2/a) when a odd, or (a/2) = 0 when a even. */
            mpz_ui_kronecker: (a, b) => gmp.z_ui_kronecker(a, b),
            /** Set rop to the least common multiple of op1 and op2. */
            mpz_lcm: (rop, op1, op2) => { gmp.z_lcm(rop, op1, op2); },
            /** Set rop to the least common multiple of op1 and op2. */
            mpz_lcm_ui: (rop, op1, op2) => { gmp.z_lcm_ui(rop, op1, op2); },
            /** Calculate the Legendre symbol (a/p). */
            mpz_legendre: (a, p) => gmp.z_legendre(a, p),
            /** Sets ln to to L[n], the n’th Lucas number. */
            mpz_lucnum_ui: (ln, n) => { gmp.z_lucnum_ui(ln, n); },
            /** Sets ln to L[n], and lnsub1 to L[n - 1]. */
            mpz_lucnum2_ui: (ln, lnsub1, n) => { gmp.z_lucnum2_ui(ln, lnsub1, n); },
            /** An implementation of the probabilistic primality test found in Knuth's Seminumerical Algorithms book. */
            mpz_millerrabin: (n, reps) => gmp.z_millerrabin(n, reps),
            /** Set r to n mod d. */
            mpz_mod: (r, n, d) => { gmp.z_mod(r, n, d); },
            /** Set r to n mod d. */
            mpz_mod_ui: (r, n, d) => { gmp.z_mod_ui(r, n, d); },
            /** Set rop to op1 * op2. */
            mpz_mul: (rop, op1, op2) => { gmp.z_mul(rop, op1, op2); },
            /** Set rop to op1 * 2^op2. */
            mpz_mul_2exp: (rop, op1, op2) => { gmp.z_mul_2exp(rop, op1, op2); },
            /** Set rop to op1 * op2. */
            mpz_mul_si: (rop, op1, op2) => { gmp.z_mul_si(rop, op1, op2); },
            /** Set rop to op1 * op2. */
            mpz_mul_ui: (rop, op1, op2) => { gmp.z_mul_ui(rop, op1, op2); },
            /** Set rop to -op. */
            mpz_neg: (rop, op) => { gmp.z_neg(rop, op); },
            /** Set rop to the next prime greater than op. */
            mpz_nextprime: (rop, op) => { gmp.z_nextprime(rop, op); },
            /** Determine whether op is odd. */
            mpz_odd_p: (op) => { gmp.z_odd_p(op); },
            /** Return non-zero if op is a perfect power, i.e., if there exist integers a and b, with b > 1, such that op = a^b. */
            mpz_perfect_power_p: (op) => gmp.z_perfect_power_p(op),
            /** Return non-zero if op is a perfect square, i.e., if the square root of op is an integer. */
            mpz_perfect_square_p: (op) => gmp.z_perfect_square_p(op),
            /** Return the population count of op. */
            mpz_popcount: (op) => gmp.z_popcount(op),
            /** Set rop to base^exp. The case 0^0 yields 1. */
            mpz_pow_ui: (rop, base, exp) => { gmp.z_pow_ui(rop, base, exp); },
            /** Set rop to (base^exp) modulo mod. */
            mpz_powm: (rop, base, exp, mod) => { gmp.z_powm(rop, base, exp, mod); },
            /** Set rop to (base^exp) modulo mod. */
            mpz_powm_sec: (rop, base, exp, mod) => { gmp.z_powm_sec(rop, base, exp, mod); },
            /** Set rop to (base^exp) modulo mod. */
            mpz_powm_ui: (rop, base, exp, mod) => { gmp.z_powm_ui(rop, base, exp, mod); },
            /** Determine whether n is prime. */
            mpz_probab_prime_p: (n, reps) => gmp.z_probab_prime_p(n, reps),
            /** Generate a random integer of at most maxSize limbs. */
            mpz_random: (rop, maxSize) => { gmp.z_random(rop, maxSize); },
            /** Generate a random integer of at most maxSize limbs, with long strings of zeros and ones in the binary representation. */
            mpz_random2: (rop, maxSize) => { gmp.z_random2(rop, maxSize); },
            /** Change the space allocated for x to n bits. */
            mpz_realloc2: (x, n) => { gmp.z_realloc2(x, n); },
            /** Remove all occurrences of the factor f from op and store the result in rop. */
            mpz_remove: (rop, op, f) => gmp.z_remove(rop, op, f),
            /** Set rop to the truncated integer part of the nth root of op. */
            mpz_root: (rop, op, n) => gmp.z_root(rop, op, n),
            /** Set root to the truncated integer part of the nth root of u. Set rem to the remainder, u - root^n. */
            mpz_rootrem: (root, rem, u, n) => { gmp.z_rootrem(root, rem, u, n); },
            /** Generate a random integer with long strings of zeros and ones in the binary representation. */
            mpz_rrandomb: (rop, state, n) => { gmp.z_rrandomb(rop, state, n); },
            /** Scan op for 0 bit. */
            mpz_scan0: (op, startingBit) => gmp.z_scan0(op, startingBit),
            /** Scan op for 1 bit. */
            mpz_scan1: (op, startingBit) => gmp.z_scan1(op, startingBit),
            /** Set the value of rop from op. */
            mpz_set: (rop, op) => { gmp.z_set(rop, op); },
            /** Set the value of rop from op. */
            mpz_set_d: (rop, op) => { gmp.z_set_d(rop, op); },
            /** Set the value of rop from op. */
            mpz_set_q: (rop, op) => { gmp.z_set_q(rop, op); },
            /** Set the value of rop from op. */
            mpz_set_si: (rop, op) => { gmp.z_set_si(rop, op); },
            /** Set the value of rop from str, a null-terminated C string in base base. */
            mpz_set_str: (rop, str, base) => gmp.z_set_str(rop, str, base),
            /** Set the value of rop from op. */
            mpz_set_ui: (rop, op) => { gmp.z_set_ui(rop, op); },
            /** Set bit bitIndex in rop. */
            mpz_setbit: (rop, bitIndex) => { gmp.z_setbit(rop, bitIndex); },
            /** Return +1 if op > 0, 0 if op = 0, and -1 if op < 0. */
            mpz_sgn: (op) => gmp.z_sgn(op),
            /** Return the size of op measured in number of limbs. */
            mpz_size: (op) => gmp.z_size(op),
            /** Return the size of op measured in number of digits in the given base. */
            mpz_sizeinbase: (op, base) => gmp.z_sizeinbase(op, base),
            /** Set rop to the truncated integer part of the square root of op. */
            mpz_sqrt: (rop, op) => { gmp.z_sqrt(rop, op); },
            /** Set rop1 to the truncated integer part of the square root of op, like mpz_sqrt. Set rop2 to the remainder op - rop1 * rop1, which will be zero if op is a perfect square. */
            mpz_sqrtrem: (rop1, rop2, op) => { gmp.z_sqrtrem(rop1, rop2, op); },
            /** Set rop to op1 - op2. */
            mpz_sub: (rop, op1, op2) => { gmp.z_sub(rop, op1, op2); },
            /** Set rop to op1 - op2. */
            mpz_sub_ui: (rop, op1, op2) => { gmp.z_sub_ui(rop, op1, op2); },
            /** Set rop to op1 - op2. */
            mpz_ui_sub: (rop, op1, op2) => { gmp.z_ui_sub(rop, op1, op2); },
            /** Set rop to rop - op1 * op2. */
            mpz_submul: (rop, op1, op2) => { gmp.z_submul(rop, op1, op2); },
            /** Set rop to rop - op1 * op2. */
            mpz_submul_ui: (rop, op1, op2) => { gmp.z_submul_ui(rop, op1, op2); },
            /** Swap the values rop1 and rop2 efficiently. */
            mpz_swap: (rop1, rop2) => { gmp.z_swap(rop1, rop2); },
            /** Return the remainder | r | where r = n - q * d, and where q = trunc(n / d). */
            mpz_tdiv_ui: (n, d) => gmp.z_tdiv_ui(n, d),
            /** Set the quotient q to trunc(n / d). */
            mpz_tdiv_q: (q, n, d) => { gmp.z_tdiv_q(q, n, d); },
            /** Set the quotient q to trunc(n / 2^b). */
            mpz_tdiv_q_2exp: (q, n, b) => { gmp.z_tdiv_q_2exp(q, n, b); },
            /** Set the quotient q to trunc(n / d), and return the remainder r = | n - q * d |. */
            mpz_tdiv_q_ui: (q, n, d) => gmp.z_tdiv_q_ui(q, n, d),
            /** Set the quotient q to trunc(n / d), and set the remainder r to n - q * d. */
            mpz_tdiv_qr: (q, r, n, d) => { gmp.z_tdiv_qr(q, r, n, d); },
            /** Set quotient q to trunc(n / d), set the remainder r to n - q * d, and return | r |. */
            mpz_tdiv_qr_ui: (q, r, n, d) => { return gmp.z_tdiv_qr_ui(q, r, n, d); },
            /** Set the remainder r to n - q * d where q = trunc(n / d). */
            mpz_tdiv_r: (r, n, d) => { gmp.z_tdiv_r(r, n, d); },
            /** Set the remainder r to n - q * 2^b where q = trunc(n / 2^b). */
            mpz_tdiv_r_2exp: (r, n, b) => { gmp.z_tdiv_r_2exp(r, n, b); },
            /** Set the remainder r to n - q * d where q = trunc(n / d), and return | r |. */
            mpz_tdiv_r_ui: (r, n, d) => gmp.z_tdiv_r_ui(r, n, d),
            /** Test bit bitIndex in op and return 0 or 1 accordingly. */
            mpz_tstbit: (op, bitIndex) => gmp.z_tstbit(op, bitIndex),
            /** Set rop to base^exp. The case 0^0 yields 1. */
            mpz_ui_pow_ui: (rop, base, exp) => { gmp.z_ui_pow_ui(rop, base, exp); },
            /** Generate a uniformly distributed random integer in the range 0 to 2^n - 1, inclusive. */
            mpz_urandomb: (rop, state, n) => { gmp.z_urandomb(rop, state, n); },
            /** Generate a uniform random integer in the range 0 to n - 1, inclusive. */
            mpz_urandomm: (rop, state, n) => { gmp.z_urandomm(rop, state, n); },
            /** Set rop to op1 bitwise exclusive-or op2. */
            mpz_xor: (rop, op1, op2) => { gmp.z_xor(rop, op1, op2); },
            /** Return a pointer to the limb array representing the absolute value of x. */
            mpz_limbs_read: (x) => gmp.z_limbs_read(x),
            /** Return a pointer to the limb array of x, intended for write access. */
            mpz_limbs_write: (x, n) => gmp.z_limbs_write(x, n),
            /** Return a pointer to the limb array of x, intended for write access. */
            mpz_limbs_modify: (x, n) => gmp.z_limbs_modify(x, n),
            /** Updates the internal size field of x. */
            mpz_limbs_finish: (x, s) => { gmp.z_limbs_finish(x, s); },
            /** Special initialization of x, using the given limb array and size. */
            mpz_roinit_n: (x, xp, xs) => gmp.z_roinit_n(x, xp, xs),
            /**************** Rational (i.e. Q) routines.  ****************/
            /** Allocates memory for the mpq_t C struct and returns pointer */
            mpq_t: () => gmp.q_t(),
            /** Deallocates memory of a mpq_t C struct */
            mpq_t_free: (mpq_ptr) => { gmp.q_t_free(mpq_ptr); },
            /** Deallocates memory of a NULL-terminated list of mpq_t variables */
            mpq_t_frees: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.q_t_free(ptrs[i]);
                }
            },
            /** Set rop to the absolute value of op. */
            mpq_abs: (rop, op) => { gmp.q_abs(rop, op); },
            /** Set sum to addend1 + addend2. */
            mpq_add: (sum, addend1, addend2) => { gmp.q_add(sum, addend1, addend2); },
            /** Remove any factors that are common to the numerator and denominator of op, and make the denominator positive. */
            mpq_canonicalize: (op) => { gmp.q_canonicalize(op); },
            /** Free the space occupied by x. */
            mpq_clear: (x) => { gmp.q_clear(x); },
            /** Free the space occupied by a NULL-terminated list of mpq_t variables. */
            mpq_clears: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.q_clear(ptrs[i]);
                }
            },
            /** Compare op1 and op2. */
            mpq_cmp: (op1, op2) => gmp.q_cmp(op1, op2),
            /** Compare op1 and num2 / den2. */
            mpq_cmp_si: (op1, num2, den2) => gmp.q_cmp_si(op1, num2, den2),
            /** Compare op1 and num2 / den2. */
            mpq_cmp_ui: (op1, num2, den2) => gmp.q_cmp_ui(op1, num2, den2),
            /** Compare op1 and op2. */
            mpq_cmp_z: (op1, op2) => gmp.q_cmp_z(op1, op2),
            /** Set quotient to dividend / divisor. */
            mpq_div: (quotient, dividend, divisor) => { gmp.q_div(quotient, dividend, divisor); },
            /** Set rop to op1 / 2^op2. */
            mpq_div_2exp: (rop, op1, op2) => { gmp.q_div_2exp(rop, op1, op2); },
            /** Return non-zero if op1 and op2 are equal, zero if they are non-equal. */
            mpq_equal: (op1, op2) => gmp.q_equal(op1, op2),
            /** Set numerator to the numerator of rational. */
            mpq_get_num: (numerator, rational) => { gmp.q_get_num(numerator, rational); },
            /** Set denominator to the denominator of rational. */
            mpq_get_den: (denominator, rational) => { gmp.q_get_den(denominator, rational); },
            /** Convert op to a double, truncating if necessary (i.e. rounding towards zero). */
            mpq_get_d: (op) => gmp.q_get_d(op),
            /** Convert op to a string of digits in base base. */
            mpq_get_str: (str, base, op) => gmp.q_get_str(str, base, op),
            /** Initialize x and set it to 0/1. */
            mpq_init: (x) => { gmp.q_init(x); },
            /** Initialize a NULL-terminated list of mpq_t variables, and set their values to 0/1. */
            mpq_inits: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.q_init(ptrs[i]);
                }
            },
            /** Set inverted_number to 1 / number. */
            mpq_inv: (inverted_number, number) => { gmp.q_inv(inverted_number, number); },
            /** Set product to multiplier * multiplicand. */
            mpq_mul: (product, multiplier, multiplicand) => { gmp.q_mul(product, multiplier, multiplicand); },
            /** Set rop to op1 * 2*op2. */
            mpq_mul_2exp: (rop, op1, op2) => { gmp.q_mul_2exp(rop, op1, op2); },
            /** Set negated_operand to -operand. */
            mpq_neg: (negated_operand, operand) => { gmp.q_neg(negated_operand, operand); },
            /** Assign rop from op. */
            mpq_set: (rop, op) => { gmp.q_set(rop, op); },
            /** Set rop to the value of op. There is no rounding, this conversion is exact. */
            mpq_set_d: (rop, op) => { gmp.q_set_d(rop, op); },
            /** Set the denominator of rational to denominator. */
            mpq_set_den: (rational, denominator) => { gmp.q_set_den(rational, denominator); },
            /** Set the numerator of rational to numerator. */
            mpq_set_num: (rational, numerator) => { gmp.q_set_num(rational, numerator); },
            /** Set the value of rop to op1 / op2. */
            mpq_set_si: (rop, op1, op2) => { gmp.q_set_si(rop, op1, op2); },
            /** Set rop from a null-terminated string str in the given base. */
            mpq_set_str: (rop, str, base) => gmp.q_set_str(rop, str, base),
            /** Set the value of rop to op1 / op2. */
            mpq_set_ui: (rop, op1, op2) => { gmp.q_set_ui(rop, op1, op2); },
            /** Assign rop from op. */
            mpq_set_z: (rop, op) => { gmp.q_set_z(rop, op); },
            /** Return +1 if op > 0, 0 if op = 0, and -1 if op < 0. */
            mpq_sgn: (op) => gmp.q_sgn(op),
            /** Set difference to minuend - subtrahend. */
            mpq_sub: (difference, minuend, subtrahend) => { gmp.q_sub(difference, minuend, subtrahend); },
            /** Swap the values rop1 and rop2 efficiently. */
            mpq_swap: (rop1, rop2) => { gmp.q_swap(rop1, rop2); },
            /**************** MPFR  ****************/
            /** Allocates memory for the mpfr_t C struct and returns pointer */
            mpfr_t: () => gmp.r_t(),
            /** Deallocates memory of a mpfr_t C struct */
            mpfr_t_free: (mpfr_ptr) => { gmp.r_t_free(mpfr_ptr); },
            /** Deallocates memory of a NULL-terminated list of mpfr_t variables */
            mpfr_t_frees: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.r_t_free(ptrs[i]);
                }
            },
            /** Return the MPFR version, as a null-terminated string. */
            mpfr_get_version: () => gmp.r_get_version(),
            /** Return a null-terminated string containing the ids of the patches applied to the MPFR library (contents of the PATCHES file), separated by spaces. */
            mpfr_get_patches: () => gmp.r_get_patches(),
            /** Return a non-zero value if MPFR was compiled as thread safe using compiler-level Thread Local Storage, return zero otherwise. */
            mpfr_buildopt_tls_p: () => gmp.r_buildopt_tls_p(),
            /** Return a non-zero value if MPFR was compiled with ‘__float128’ support, return zero otherwise. */
            mpfr_buildopt_float128_p: () => gmp.r_buildopt_float128_p(),
            /** Return a non-zero value if MPFR was compiled with decimal float support, return zero otherwise. */
            mpfr_buildopt_decimal_p: () => gmp.r_buildopt_decimal_p(),
            /** Return a non-zero value if MPFR was compiled with GMP internals, return zero otherwise. */
            mpfr_buildopt_gmpinternals_p: () => gmp.r_buildopt_gmpinternals_p(),
            /** Return a non-zero value if MPFR was compiled so that all threads share the same cache for one MPFR constant, return zero otherwise. */
            mpfr_buildopt_sharedcache_p: () => gmp.r_buildopt_sharedcache_p(),
            /** Return a string saying which thresholds file has been used at compile time. */
            mpfr_buildopt_tune_case: () => gmp.r_buildopt_tune_case(),
            /** Return the (current) smallest exponent allowed for a floating-point variable. */
            mpfr_get_emin: () => gmp.r_get_emin(),
            /** Set the smallest exponent allowed for a floating-point variable. */
            mpfr_set_emin: (exp) => gmp.r_set_emin(exp),
            /** Return the minimum exponent allowed for mpfr_set_emin. */
            mpfr_get_emin_min: () => gmp.r_get_emin_min(),
            /** Return the maximum exponent allowed for mpfr_set_emin. */
            mpfr_get_emin_max: () => gmp.r_get_emin_max(),
            /** Return the (current) largest exponent allowed for a floating-point variable. */
            mpfr_get_emax: () => gmp.r_get_emax(),
            /** Set the largest exponent allowed for a floating-point variable. */
            mpfr_set_emax: (exp) => gmp.r_set_emax(exp),
            /** Return the minimum exponent allowed for mpfr_set_emax. */
            mpfr_get_emax_min: () => gmp.r_get_emax_min(),
            /** Return the maximum exponent allowed for mpfr_set_emax. */
            mpfr_get_emax_max: () => gmp.r_get_emax_max(),
            /** Set the default rounding mode to rnd. */
            mpfr_set_default_rounding_mode: (rnd) => { gmp.r_set_default_rounding_mode(rnd); },
            /** Get the default rounding mode. */
            mpfr_get_default_rounding_mode: () => gmp.r_get_default_rounding_mode(),
            /** Return a string ("MPFR_RNDD", "MPFR_RNDU", "MPFR_RNDN", "MPFR_RNDZ", "MPFR_RNDA") corresponding to the rounding mode rnd, or a null pointer if rnd is an invalid rounding mode. */
            mpfr_print_rnd_mode: (rnd) => gmp.r_print_rnd_mode(rnd),
            /** Clear (lower) all global flags (underflow, overflow, divide-by-zero, invalid, inexact, erange). */
            mpfr_clear_flags: () => { gmp.r_clear_flags(); },
            /** Clear (lower) the underflow flag. */
            mpfr_clear_underflow: () => { gmp.r_clear_underflow(); },
            /** Clear (lower) the overflow flag. */
            mpfr_clear_overflow: () => { gmp.r_clear_overflow(); },
            /** Clear (lower) the divide-by-zero flag. */
            mpfr_clear_divby0: () => { gmp.r_clear_divby0(); },
            /** Clear (lower) the invalid flag. */
            mpfr_clear_nanflag: () => { gmp.r_clear_nanflag(); },
            /** Clear (lower) the inexact flag. */
            mpfr_clear_inexflag: () => { gmp.r_clear_inexflag(); },
            /** Clear (lower) the erange flag. */
            mpfr_clear_erangeflag: () => { gmp.r_clear_erangeflag(); },
            /** Set (raised) the underflow flag. */
            mpfr_set_underflow: () => { gmp.r_set_underflow(); },
            /** Set (raised) the overflow flag. */
            mpfr_set_overflow: () => { gmp.r_set_overflow(); },
            /** Set (raised) the divide-by-zero flag. */
            mpfr_set_divby0: () => { gmp.r_set_divby0(); },
            /** Set (raised) the invalid flag. */
            mpfr_set_nanflag: () => { gmp.r_set_nanflag(); },
            /** Set (raised) the inexact flag. */
            mpfr_set_inexflag: () => { gmp.r_set_inexflag(); },
            /** Set (raised) the erange flag. */
            mpfr_set_erangeflag: () => { gmp.r_set_erangeflag(); },
            /** Return the underflow flag, which is non-zero iff the flag is set. */
            mpfr_underflow_p: () => gmp.r_underflow_p(),
            /** Return the overflow flag, which is non-zero iff the flag is set. */
            mpfr_overflow_p: () => gmp.r_overflow_p(),
            /** Return the divide-by-zero flag, which is non-zero iff the flag is set. */
            mpfr_divby0_p: () => gmp.r_divby0_p(),
            /** Return the invalid flag, which is non-zero iff the flag is set. */
            mpfr_nanflag_p: () => gmp.r_nanflag_p(),
            /** Return the inexact flag, which is non-zero iff the flag is set. */
            mpfr_inexflag_p: () => gmp.r_inexflag_p(),
            /** Return the erange flag, which is non-zero iff the flag is set. */
            mpfr_erangeflag_p: () => gmp.r_erangeflag_p(),
            /** Clear (lower) the group of flags specified by mask. */
            mpfr_flags_clear: (mask) => { gmp.r_flags_clear(mask); },
            /** Set (raise) the group of flags specified by mask. */
            mpfr_flags_set: (mask) => { gmp.r_flags_set(mask); },
            /** Return the flags specified by mask. */
            mpfr_flags_test: (mask) => gmp.r_flags_test(mask),
            /** Return all the flags. */
            mpfr_flags_save: () => gmp.r_flags_save(),
            /** Restore the flags specified by mask to their state represented in flags. */
            mpfr_flags_restore: (flags, mask) => { gmp.r_flags_restore(flags, mask); },
            /** Check that x is within the current range of acceptable values. */
            mpfr_check_range: (x, t, rnd) => gmp.r_check_range(x, t, rnd),
            /** Initialize x, set its precision to be exactly prec bits and its value to NaN. */
            mpfr_init2: (x, prec) => { gmp.r_init2(x, prec); },
            /** Initialize all the mpfr_t variables of the given variable argument x, set their precision to be exactly prec bits and their value to NaN. */
            mpfr_inits2: (prec, ...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.r_init2(ptrs[i], prec);
                }
            },
            /** Initialize x, set its precision to the default precision, and set its value to NaN. */
            mpfr_init: (x) => { gmp.r_init(x); },
            /** Initialize all the mpfr_t variables of the given list x, set their precision to the default precision and their value to NaN. */
            mpfr_inits: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.r_init(ptrs[i]);
                }
            },
            /** Free the space occupied by the significand of x. */
            mpfr_clear: (x) => { gmp.r_clear(x); },
            /** Free the space occupied by all the mpfr_t variables of the given list x. */
            mpfr_clears: (...ptrs) => {
                for (let i = 0; i < ptrs.length; i++) {
                    if (!ptrs[i])
                        return;
                    gmp.r_clear(ptrs[i]);
                }
            },
            /** Round x according to rnd with precision prec, which must be an integer between MPFR_PREC_MIN and MPFR_PREC_MAX (otherwise the behavior is undefined). */
            mpfr_prec_round: (x, prec, rnd) => gmp.r_prec_round(x, prec, rnd),
            /** Return non-zero value if one is able to round correctly x to precision prec with the direction rnd2, and 0 otherwise. */
            mpfr_can_round: (b, err, rnd1, rnd2, prec) => gmp.r_can_round(b, err, rnd1, rnd2, prec),
            /** Return the minimal number of bits required to store the significand of x, and 0 for special values, including 0. */
            mpfr_min_prec: (x) => gmp.r_min_prec(x),
            /** Return the exponent of x, assuming that x is a non-zero ordinary number and the significand is considered in [1/2,1). */
            mpfr_get_exp: (x) => gmp.r_get_exp(x),
            /** Set the exponent of x if e is in the current exponent range. */
            mpfr_set_exp: (x, e) => gmp.r_set_exp(x, e),
            /** Return the precision of x, i.e., the number of bits used to store its significand. */
            mpfr_get_prec: (x) => gmp.r_get_prec(x),
            /** Reset the precision of x to be exactly prec bits, and set its value to NaN. */
            mpfr_set_prec: (x, prec) => { gmp.r_set_prec(x, prec); },
            /** Reset the precision of x to be exactly prec bits. */
            mpfr_set_prec_raw: (x, prec) => { gmp.r_set_prec_raw(x, prec); },
            /** Set the default precision to be exactly prec bits, where prec can be any integer between MPFR_PREC_MINand MPFR_PREC_MAX. */
            mpfr_set_default_prec: (prec) => { gmp.r_set_default_prec(prec); },
            /** Return the current default MPFR precision in bits. */
            mpfr_get_default_prec: () => gmp.r_get_default_prec(),
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set_d: (rop, op, rnd) => gmp.r_set_d(rop, op, rnd),
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set_z: (rop, op, rnd) => gmp.r_set_z(rop, op, rnd),
            /** Set the value of rop from op multiplied by two to the power e, rounded toward the given direction rnd. */
            mpfr_set_z_2exp: (rop, op, e, rnd) => gmp.r_set_z_2exp(rop, op, e, rnd),
            /** Set the variable x to NaN (Not-a-Number). */
            mpfr_set_nan: (x) => { gmp.r_set_nan(x); },
            /** Set the variable x to infinity. */
            mpfr_set_inf: (x, sign) => { gmp.r_set_inf(x, sign); },
            /** Set the variable x to zero. */
            mpfr_set_zero: (x, sign) => { gmp.r_set_zero(x, sign); },
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set_si: (rop, op, rnd) => gmp.r_set_si(rop, op, rnd),
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set_ui: (rop, op, rnd) => gmp.r_set_ui(rop, op, rnd),
            /** Set the value of rop from op multiplied by two to the power e, rounded toward the given direction rnd. */
            mpfr_set_si_2exp: (rop, op, e, rnd) => gmp.r_set_si_2exp(rop, op, e, rnd),
            /** Set the value of rop from op multiplied by two to the power e, rounded toward the given direction rnd. */
            mpfr_set_ui_2exp: (rop, op, e, rnd) => gmp.r_set_ui_2exp(rop, op, e, rnd),
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set_q: (rop, op, rnd) => gmp.r_set_q(rop, op, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul_q: (rop, op1, op2, rnd) => gmp.r_mul_q(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div_q: (rop, op1, op2, rnd) => gmp.r_div_q(rop, op1, op2, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add_q: (rop, op1, op2, rnd) => gmp.r_add_q(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub_q: (rop, op1, op2, rnd) => gmp.r_sub_q(rop, op1, op2, rnd),
            /** Compare op1 and op2. */
            mpfr_cmp_q: (op1, op2) => gmp.r_cmp_q(op1, op2),
            /** Convert op to a mpq_t. */
            mpfr_get_q: (rop, op) => gmp.r_get_q(rop, op),
            /** Set rop to the value of the string s in base base, rounded in the direction rnd. */
            mpfr_set_str: (rop, s, base, rnd) => gmp.r_set_str(rop, s, base, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set: (rop, op, rnd) => gmp.r_init_set(rop, op, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set_ui: (rop, op, rnd) => gmp.r_init_set_ui(rop, op, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set_si: (rop, op, rnd) => gmp.r_init_set_si(rop, op, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set_d: (rop, op, rnd) => gmp.r_init_set_d(rop, op, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set_z: (rop, op, rnd) => gmp.r_init_set_z(rop, op, rnd),
            /** Initialize rop and set its value from op, rounded in the direction rnd. */
            mpfr_init_set_q: (rop, op, rnd) => gmp.r_init_set_q(rop, op, rnd),
            /** Initialize x and set its value from the string s in base base, rounded in the direction rnd. */
            mpfr_init_set_str: (x, s, base, rnd) => gmp.r_init_set_str(x, s, base, rnd),
            /** Set rop to the absolute value of op rounded in the direction rnd. */
            mpfr_abs: (rop, op, rnd) => gmp.r_abs(rop, op, rnd),
            /** Set the value of rop from op rounded toward the given direction rnd. */
            mpfr_set: (rop, op, rnd) => gmp.r_set(rop, op, rnd),
            /** Set rop to -op rounded in the direction rnd. */
            mpfr_neg: (rop, op, rnd) => gmp.r_neg(rop, op, rnd),
            /** Return a non-zero value iff op has its sign bit set (i.e., if it is negative, -0, or a NaN whose representation has its sign bit set). */
            mpfr_signbit: (op) => gmp.r_signbit(op),
            /** Set the value of rop from op, rounded toward the given direction rnd, then set (resp. clear) its sign bit if s is non-zero (resp. zero), even when op is a NaN. */
            mpfr_setsign: (rop, op, s, rnd) => gmp.r_setsign(rop, op, s, rnd),
            /** Set the value of rop from op1, rounded toward the given direction rnd, then set its sign bit to that of op2 (even when op1 or op2 is a NaN). */
            mpfr_copysign: (rop, op1, op2, rnd) => gmp.r_copysign(rop, op1, op2, rnd),
            /** Put the scaled significand of op (regarded as an integer, with the precision of op) into rop, and return the exponent exp (which may be outside the current exponent range) such that op = rop * 2^exp. */
            mpfr_get_z_2exp: (rop, op) => gmp.r_get_z_2exp(rop, op),
            /** Convert op to a double, using the rounding mode rnd. */
            mpfr_get_d: (op, rnd) => gmp.r_get_d(op, rnd),
            /** Return d and set exp such that 0.5 ≤ abs(d) <1 and d * 2^exp = op rounded to double precision, using the given rounding mode. */
            mpfr_get_d_2exp: (exp, op, rnd) => gmp.r_get_d_2exp(exp, op, rnd),
            /** Set exp and y such that 0.5 ≤ abs(y) < 1 and y * 2^exp = x rounded to the precision of y, using the given rounding mode. */
            mpfr_frexp: (exp, y, x, rnd) => gmp.r_frexp(exp, y, x, rnd),
            /** Convert op to a long after rounding it with respect to rnd. */
            mpfr_get_si: (op, rnd) => gmp.r_get_si(op, rnd),
            /** Convert op to an unsigned long after rounding it with respect to rnd. */
            mpfr_get_ui: (op, rnd) => gmp.r_get_ui(op, rnd),
            /** Return the minimal integer m such that any number of p bits, when output with m digits in radix b with rounding to nearest, can be recovered exactly when read again, still with rounding to nearest. More precisely, we have m = 1 + ceil(p*log(2)/log(b)), with p replaced by p-1 if b is a power of 2. */
            mpfr_get_str_ndigits: (b, p) => gmp.r_get_str_ndigits(b, p),
            /** Convert op to a string of digits in base b, with rounding in the direction rnd, where n is either zero (see below) or the number of significant digits output in the string; in the latter case, n must be greater or equal to 2. */
            mpfr_get_str: (str, expptr, base, n, op, rnd) => gmp.r_get_str(str, expptr, base, n, op, rnd),
            /** Convert op to a mpz_t, after rounding it with respect to rnd. */
            mpfr_get_z: (rop, op, rnd) => gmp.r_get_z(rop, op, rnd),
            /** Free a string allocated by mpfr_get_str using the unallocation function (see GNU MPFR - Memory Handling). */
            mpfr_free_str: (str) => { gmp.r_free_str(str); },
            /** Generate a uniformly distributed random float. */
            mpfr_urandom: (rop, state, rnd) => gmp.r_urandom(rop, state, rnd),
            /** Generate one random float according to a standard normal gaussian distribution (with mean zero and variance one). */
            mpfr_nrandom: (rop, state, rnd) => gmp.r_nrandom(rop, state, rnd),
            /** Generate one random float according to an exponential distribution, with mean one. */
            mpfr_erandom: (rop, state, rnd) => gmp.r_erandom(rop, state, rnd),
            /** Generate a uniformly distributed random float in the interval 0 ≤ rop < 1. */
            mpfr_urandomb: (rop, state) => gmp.r_urandomb(rop, state),
            /** Equivalent to mpfr_nexttoward where y is plus infinity. */
            mpfr_nextabove: (x) => { gmp.r_nextabove(x); },
            /** Equivalent to mpfr_nexttoward where y is minus infinity. */
            mpfr_nextbelow: (x) => { gmp.r_nextbelow(x); },
            /** Replace x by the next floating-point number in the direction of y. */
            mpfr_nexttoward: (x, y) => { gmp.r_nexttoward(x, y); },
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_pow: (rop, op1, op2, rnd) => gmp.r_pow(rop, op1, op2, rnd),
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_pow_si: (rop, op1, op2, rnd) => gmp.r_pow_si(rop, op1, op2, rnd),
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_pow_ui: (rop, op1, op2, rnd) => gmp.r_pow_ui(rop, op1, op2, rnd),
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_ui_pow_ui: (rop, op1, op2, rnd) => gmp.r_ui_pow_ui(rop, op1, op2, rnd),
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_ui_pow: (rop, op1, op2, rnd) => gmp.r_ui_pow(rop, op1, op2, rnd),
            /** Set rop to op1 raised to op2, rounded in the direction rnd. */
            mpfr_pow_z: (rop, op1, op2, rnd) => gmp.r_pow_z(rop, op1, op2, rnd),
            /** Set rop to the square root of op rounded in the direction rnd. */
            mpfr_sqrt: (rop, op, rnd) => gmp.r_sqrt(rop, op, rnd),
            /** Set rop to the square root of op rounded in the direction rnd. */
            mpfr_sqrt_ui: (rop, op, rnd) => gmp.r_sqrt_ui(rop, op, rnd),
            /** Set rop to the reciprocal square root of op rounded in the direction rnd. */
            mpfr_rec_sqrt: (rop, op, rnd) => gmp.r_rec_sqrt(rop, op, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add: (rop, op1, op2, rnd) => gmp.r_add(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub: (rop, op1, op2, rnd) => gmp.r_sub(rop, op1, op2, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul: (rop, op1, op2, rnd) => gmp.r_mul(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div: (rop, op1, op2, rnd) => gmp.r_div(rop, op1, op2, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add_ui: (rop, op1, op2, rnd) => gmp.r_add_ui(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub_ui: (rop, op1, op2, rnd) => gmp.r_sub_ui(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_ui_sub: (rop, op1, op2, rnd) => gmp.r_ui_sub(rop, op1, op2, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul_ui: (rop, op1, op2, rnd) => gmp.r_mul_ui(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div_ui: (rop, op1, op2, rnd) => gmp.r_div_ui(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_ui_div: (rop, op1, op2, rnd) => gmp.r_ui_div(rop, op1, op2, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add_si: (rop, op1, op2, rnd) => gmp.r_add_si(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub_si: (rop, op1, op2, rnd) => gmp.r_sub_si(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_si_sub: (rop, op1, op2, rnd) => gmp.r_si_sub(rop, op1, op2, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul_si: (rop, op1, op2, rnd) => gmp.r_mul_si(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div_si: (rop, op1, op2, rnd) => gmp.r_div_si(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_si_div: (rop, op1, op2, rnd) => gmp.r_si_div(rop, op1, op2, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add_d: (rop, op1, op2, rnd) => gmp.r_add_d(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub_d: (rop, op1, op2, rnd) => gmp.r_sub_d(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_d_sub: (rop, op1, op2, rnd) => gmp.r_d_sub(rop, op1, op2, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul_d: (rop, op1, op2, rnd) => gmp.r_mul_d(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div_d: (rop, op1, op2, rnd) => gmp.r_div_d(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_d_div: (rop, op1, op2, rnd) => gmp.r_d_div(rop, op1, op2, rnd),
            /** Set rop to the square of op rounded in the direction rnd. */
            mpfr_sqr: (rop, op, rnd) => gmp.r_sqr(rop, op, rnd),
            /** Set rop to the value of Pi rounded in the direction rnd. */
            mpfr_const_pi: (rop, rnd) => gmp.r_const_pi(rop, rnd),
            /** Set rop to the logarithm of 2 rounded in the direction rnd. */
            mpfr_const_log2: (rop, rnd) => gmp.r_const_log2(rop, rnd),
            /** Set rop to the value of Euler’s constant 0.577… rounded in the direction rnd. */
            mpfr_const_euler: (rop, rnd) => gmp.r_const_euler(rop, rnd),
            /** Set rop to the value of Catalan’s constant 0.915… rounded in the direction rnd. */
            mpfr_const_catalan: (rop, rnd) => gmp.r_const_catalan(rop, rnd),
            /** Set rop to the arithmetic-geometric mean of op1 and op2 rounded in the direction rnd. */
            mpfr_agm: (rop, op1, op2, rnd) => gmp.r_agm(rop, op1, op2, rnd),
            /** Set rop to the natural logarithm of op rounded in the direction rnd. */
            mpfr_log: (rop, op, rnd) => gmp.r_log(rop, op, rnd),
            /** Set rop to log2(op) rounded in the direction rnd. */
            mpfr_log2: (rop, op, rnd) => gmp.r_log2(rop, op, rnd),
            /** Set rop to log10(op) rounded in the direction rnd. */
            mpfr_log10: (rop, op, rnd) => gmp.r_log10(rop, op, rnd),
            /** Set rop to the logarithm of one plus op, rounded in the direction rnd. */
            mpfr_log1p: (rop, op, rnd) => gmp.r_log1p(rop, op, rnd),
            /** Set rop to the natural logarithm of op rounded in the direction rnd. */
            mpfr_log_ui: (rop, op, rnd) => gmp.r_log_ui(rop, op, rnd),
            /** Set rop to the exponential of op rounded in the direction rnd. */
            mpfr_exp: (rop, op, rnd) => gmp.r_exp(rop, op, rnd),
            /** Set rop to 2^op rounded in the direction rnd. */
            mpfr_exp2: (rop, op, rnd) => gmp.r_exp2(rop, op, rnd),
            /** Set rop to 10^op rounded in the direction rnd. */
            mpfr_exp10: (rop, op, rnd) => gmp.r_exp10(rop, op, rnd),
            /** Set rop to the e^op - 1, rounded in the direction rnd. */
            mpfr_expm1: (rop, op, rnd) => gmp.r_expm1(rop, op, rnd),
            /** Set rop to the exponential integral of op rounded in the direction rnd. */
            mpfr_eint: (rop, op, rnd) => gmp.r_eint(rop, op, rnd),
            /** Set rop to real part of the dilogarithm of op rounded in the direction rnd. */
            mpfr_li2: (rop, op, rnd) => gmp.r_li2(rop, op, rnd),
            /** Compare op1 and op2. */
            mpfr_cmp: (op1, op2) => gmp.r_cmp(op1, op2),
            /** Compare op1 and op2. */
            mpfr_cmp_d: (op1, op2) => gmp.r_cmp_d(op1, op2),
            /** Compare op1 and op2. */
            mpfr_cmp_ui: (op1, op2) => gmp.r_cmp_ui(op1, op2),
            /** Compare op1 and op2. */
            mpfr_cmp_si: (op1, op2) => gmp.r_cmp_si(op1, op2),
            /** Compare op1 and op2 * 2^e. */
            mpfr_cmp_ui_2exp: (op1, op2, e) => gmp.r_cmp_ui_2exp(op1, op2, e),
            /** Compare op1 and op2 * 2^e. */
            mpfr_cmp_si_2exp: (op1, op2, e) => gmp.r_cmp_si_2exp(op1, op2, e),
            /** Compare |op1| and |op2|. */
            mpfr_cmpabs: (op1, op2) => gmp.r_cmpabs(op1, op2),
            /** Compare |op1| and |op2|. */
            mpfr_cmpabs_ui: (op1, op2) => gmp.r_cmpabs_ui(op1, op2),
            /** Compute the relative difference between op1 and op2 and store the result in rop. */
            mpfr_reldiff: (rop, op1, op2, rnd) => { gmp.r_reldiff(rop, op1, op2, rnd); },
            /** Return non-zero if op1 and op2 are both non-zero ordinary numbers with the same exponent and the same first op3 bits. */
            mpfr_eq: (op1, op2, op3) => gmp.r_eq(op1, op2, op3),
            /** Return a positive value if op > 0, zero if op = 0, and a negative value if op < 0. */
            mpfr_sgn: (op) => gmp.r_sgn(op),
            /** Set rop to op1 * 2^op2 rounded in the direction rnd. */
            mpfr_mul_2exp: (rop, op1, op2, rnd) => gmp.r_mul_2exp(rop, op1, op2, rnd),
            /** Set rop to op1 divided by 2^op2 rounded in the direction rnd. */
            mpfr_div_2exp: (rop, op1, op2, rnd) => gmp.r_div_2exp(rop, op1, op2, rnd),
            /** Set rop to op1 * 2^op2 rounded in the direction rnd. */
            mpfr_mul_2ui: (rop, op1, op2, rnd) => gmp.r_mul_2ui(rop, op1, op2, rnd),
            /** Set rop to op1 divided by 2^op2 rounded in the direction rnd. */
            mpfr_div_2ui: (rop, op1, op2, rnd) => gmp.r_div_2ui(rop, op1, op2, rnd),
            /** Set rop to op1 * 2^op2 rounded in the direction rnd. */
            mpfr_mul_2si: (rop, op1, op2, rnd) => gmp.r_mul_2si(rop, op1, op2, rnd),
            /** Set rop to op1 divided by 2^op2 rounded in the direction rnd. */
            mpfr_div_2si: (rop, op1, op2, rnd) => gmp.r_div_2si(rop, op1, op2, rnd),
            /** Set rop to op rounded to the nearest representable integer in the given direction rnd. */
            mpfr_rint: (rop, op, rnd) => gmp.r_rint(rop, op, rnd),
            /** Set rop to op rounded to the nearest representable integer, rounding halfway cases with the even-rounding rule zero (like mpfr_rint(mpfr_t, mpfr_t, mpfr_rnd_t) with MPFR_RNDN). */
            mpfr_roundeven: (rop, op) => gmp.r_roundeven(rop, op),
            /** Set rop to op rounded to the nearest representable integer, rounding halfway cases away from zero (as in the roundTiesToAway mode of IEEE 754-2008). */
            mpfr_round: (rop, op) => gmp.r_round(rop, op),
            /** Set rop to op rounded to the next representable integer toward zero (like mpfr_rint(mpfr_t, mpfr_t, mpfr_rnd_t) with MPFR_RNDZ). */
            mpfr_trunc: (rop, op) => gmp.r_trunc(rop, op),
            /** Set rop to op rounded to the next higher or equal representable integer (like mpfr_rint(mpfr_t, mpfr_t, mpfr_rnd_t) with MPFR_RNDU). */
            mpfr_ceil: (rop, op) => gmp.r_ceil(rop, op),
            /** Set rop to op rounded to the next lower or equal representable integer. */
            mpfr_floor: (rop, op) => gmp.r_floor(rop, op),
            /** Set rop to op rounded to the nearest integer, rounding halfway cases to the nearest even integer. */
            mpfr_rint_roundeven: (rop, op, rnd) => gmp.r_rint_roundeven(rop, op, rnd),
            /** Set rop to op rounded to the nearest integer, rounding halfway cases away from zero. */
            mpfr_rint_round: (rop, op, rnd) => gmp.r_rint_round(rop, op, rnd),
            /** Set rop to op rounded to the next integer toward zero. */
            mpfr_rint_trunc: (rop, op, rnd) => gmp.r_rint_trunc(rop, op, rnd),
            /** Set rop to op rounded to the next higher or equal integer. */
            mpfr_rint_ceil: (rop, op, rnd) => gmp.r_rint_ceil(rop, op, rnd),
            /** Set rop to op rounded to the next lower or equal integer. */
            mpfr_rint_floor: (rop, op, rnd) => gmp.r_rint_floor(rop, op, rnd),
            /** Set rop to the fractional part of op, having the same sign as op, rounded in the direction rnd. */
            mpfr_frac: (rop, op, rnd) => gmp.r_frac(rop, op, rnd),
            /** Set simultaneously iop to the integral part of op and fop to the fractional part of op, rounded in the direction rnd with the corresponding precision of iop and fop. */
            mpfr_modf: (rop, fop, op, rnd) => gmp.r_modf(rop, fop, op, rnd),
            /** Set r to the value of x - n * y, rounded according to the direction rnd, where n is the integer quotient of x divided by y, rounded to the nearest integer (ties rounded to even). */
            mpfr_remquo: (r, q, x, y, rnd) => gmp.r_remquo(r, q, x, y, rnd),
            /** Set r to the value of x - n * y, rounded according to the direction rnd, where n is the integer quotient of x divided by y, rounded to the nearest integer (ties rounded to even). */
            mpfr_remainder: (rop, x, y, rnd) => gmp.r_remainder(rop, x, y, rnd),
            /** Set r to the value of x - n * y, rounded according to the direction rnd, where n is the integer quotient of x divided by y, rounded toward zero. */
            mpfr_fmod: (rop, x, y, rnd) => gmp.r_fmod(rop, x, y, rnd),
            /** Set r to the value of x - n * y, rounded according to the direction rnd, where n is the integer quotient of x divided by y, rounded toward zero. */
            mpfr_fmodquo: (rop, q, x, y, rnd) => gmp.r_fmodquo(rop, q, x, y, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) unsigned long when rounded to an integer in the direction rnd. */
            mpfr_fits_ulong_p: (op, rnd) => gmp.r_fits_ulong_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) long when rounded to an integer in the direction rnd. */
            mpfr_fits_slong_p: (op, rnd) => gmp.r_fits_slong_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) unsigned int when rounded to an integer in the direction rnd. */
            mpfr_fits_uint_p: (op, rnd) => gmp.r_fits_uint_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) int when rounded to an integer in the direction rnd. */
            mpfr_fits_sint_p: (op, rnd) => gmp.r_fits_sint_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (16-bit) unsigned short when rounded to an integer in the direction rnd. */
            mpfr_fits_ushort_p: (op, rnd) => gmp.r_fits_ushort_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (16-bit) short when rounded to an integer in the direction rnd. */
            mpfr_fits_sshort_p: (op, rnd) => gmp.r_fits_sshort_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) unsigned long when rounded to an integer in the direction rnd. */
            mpfr_fits_uintmax_p: (op, rnd) => gmp.r_fits_uintmax_p(op, rnd),
            /** Return non-zero if op would fit in the C data type (32-bit) long when rounded to an integer in the direction rnd. */
            mpfr_fits_intmax_p: (op, rnd) => gmp.r_fits_intmax_p(op, rnd),
            /** Swap the structures pointed to by x and y. */
            mpfr_swap: (x, y) => { gmp.r_swap(x, y); },
            /** Output op on stdout in some unspecified format, then a newline character. This function is mainly for debugging purpose. Thus invalid data may be supported. */
            mpfr_dump: (op) => { gmp.r_dump(op); },
            /** Return non-zero if op is NaN. Return zero otherwise. */
            mpfr_nan_p: (op) => gmp.r_nan_p(op),
            /** Return non-zero if op is an infinity. Return zero otherwise. */
            mpfr_inf_p: (op) => gmp.r_inf_p(op),
            /** Return non-zero if op is an ordinary number (i.e., neither NaN nor an infinity). Return zero otherwise. */
            mpfr_number_p: (op) => gmp.r_number_p(op),
            /** Return non-zero iff op is an integer. */
            mpfr_integer_p: (op) => gmp.r_integer_p(op),
            /** Return non-zero if op is zero. Return zero otherwise. */
            mpfr_zero_p: (op) => gmp.r_zero_p(op),
            /** Return non-zero if op is a regular number (i.e., neither NaN, nor an infinity nor zero). Return zero otherwise. */
            mpfr_regular_p: (op) => gmp.r_regular_p(op),
            /** Return non-zero if op1 > op2, and zero otherwise. */
            mpfr_greater_p: (op1, op2) => gmp.r_greater_p(op1, op2),
            /** Return non-zero if op1 ≥ op2, and zero otherwise. */
            mpfr_greaterequal_p: (op1, op2) => gmp.r_greaterequal_p(op1, op2),
            /** Return non-zero if op1 < op2, and zero otherwise. */
            mpfr_less_p: (op1, op2) => gmp.r_less_p(op1, op2),
            /** Return non-zero if op1 ≤ op2, and zero otherwise. */
            mpfr_lessequal_p: (op1, op2) => gmp.r_lessequal_p(op1, op2),
            /** Return non-zero if op1 < op2 or op1 > op2 (i.e., neither op1, nor op2 is NaN, and op1 ≠ op2), zero otherwise (i.e., op1 and/or op2 is NaN, or op1 = op2). */
            mpfr_lessgreater_p: (op1, op2) => gmp.r_lessgreater_p(op1, op2),
            /** Return non-zero if op1 = op2, and zero otherwise. */
            mpfr_equal_p: (op1, op2) => gmp.r_equal_p(op1, op2),
            /** Return non-zero if op1 or op2 is a NaN (i.e., they cannot be compared), zero otherwise. */
            mpfr_unordered_p: (op1, op2) => gmp.r_unordered_p(op1, op2),
            /** Set rop to the inverse hyperbolic tangent of op rounded in the direction rnd. */
            mpfr_atanh: (rop, op, rnd) => gmp.r_atanh(rop, op, rnd),
            /** Set rop to the inverse hyperbolic cosine of op rounded in the direction rnd. */
            mpfr_acosh: (rop, op, rnd) => gmp.r_acosh(rop, op, rnd),
            /** Set rop to the inverse hyperbolic sine of op rounded in the direction rnd. */
            mpfr_asinh: (rop, op, rnd) => gmp.r_asinh(rop, op, rnd),
            /** Set rop to the hyperbolic cosine of op rounded in the direction rnd. */
            mpfr_cosh: (rop, op, rnd) => gmp.r_cosh(rop, op, rnd),
            /** Set rop to the hyperbolic sine of op rounded in the direction rnd. */
            mpfr_sinh: (rop, op, rnd) => gmp.r_sinh(rop, op, rnd),
            /** Set rop to the hyperbolic tangent of op rounded in the direction rnd. */
            mpfr_tanh: (rop, op, rnd) => gmp.r_tanh(rop, op, rnd),
            /** Set simultaneously sop to the hyperbolic sine of op and cop to the hyperbolic cosine of op, rounded in the direction rnd with the corresponding precision of sop and cop, which must be different variables. */
            mpfr_sinh_cosh: (sop, cop, op, rnd) => gmp.r_sinh_cosh(sop, cop, op, rnd),
            /** Set rop to the hyperbolic secant of op rounded in the direction rnd. */
            mpfr_sech: (rop, op, rnd) => gmp.r_sech(rop, op, rnd),
            /** Set rop to the hyperbolic cosecant of op rounded in the direction rnd. */
            mpfr_csch: (rop, op, rnd) => gmp.r_csch(rop, op, rnd),
            /** Set rop to the hyperbolic cotangent of op rounded in the direction rnd. */
            mpfr_coth: (rop, op, rnd) => gmp.r_coth(rop, op, rnd),
            /** Set rop to the arc-cosine of op rounded in the direction rnd. */
            mpfr_acos: (rop, op, rnd) => gmp.r_acos(rop, op, rnd),
            /** Set rop to the arc-sine of op rounded in the direction rnd. */
            mpfr_asin: (rop, op, rnd) => gmp.r_asin(rop, op, rnd),
            /** Set rop to the arc-tangent of op rounded in the direction rnd. */
            mpfr_atan: (rop, op, rnd) => gmp.r_atan(rop, op, rnd),
            /** Set rop to the sine of op rounded in the direction rnd. */
            mpfr_sin: (rop, op, rnd) => gmp.r_sin(rop, op, rnd),
            /** Set simultaneously sop to the sine of op and cop to the cosine of op, rounded in the direction rnd with the corresponding precisions of sop and cop, which must be different variables. */
            mpfr_sin_cos: (sop, cop, op, rnd) => gmp.r_sin_cos(sop, cop, op, rnd),
            /** Set rop to the cosine of op rounded in the direction rnd. */
            mpfr_cos: (rop, op, rnd) => gmp.r_cos(rop, op, rnd),
            /** Set rop to the tangent of op rounded in the direction rnd. */
            mpfr_tan: (rop, op, rnd) => gmp.r_tan(rop, op, rnd),
            /** Set rop to the arc-tangent2 of y and x rounded in the direction rnd. */
            mpfr_atan2: (rop, y, x, rnd) => gmp.r_atan2(rop, y, x, rnd),
            /** Set rop to the secant of op rounded in the direction rnd. */
            mpfr_sec: (rop, op, rnd) => gmp.r_sec(rop, op, rnd),
            /** Set rop to the cosecant of op rounded in the direction rnd. */
            mpfr_csc: (rop, op, rnd) => gmp.r_csc(rop, op, rnd),
            /** Set rop to the cotangent of op rounded in the direction rnd. */
            mpfr_cot: (rop, op, rnd) => gmp.r_cot(rop, op, rnd),
            /** Set rop to the Euclidean norm of x and y, i.e., the square root of the sum of the squares of x and y rounded in the direction rnd. */
            mpfr_hypot: (rop, x, y, rnd) => gmp.r_hypot(rop, x, y, rnd),
            /** Set rop to the value of the error function on op rounded in the direction rnd. */
            mpfr_erf: (rop, op, rnd) => gmp.r_erf(rop, op, rnd),
            /** Set rop to the value of the complementary error function on op rounded in the direction rnd. */
            mpfr_erfc: (rop, op, rnd) => gmp.r_erfc(rop, op, rnd),
            /** Set rop to the cubic root of op rounded in the direction rnd. */
            mpfr_cbrt: (rop, op, rnd) => gmp.r_cbrt(rop, op, rnd),
            /** Set rop to the kth root of op rounded in the direction rnd. */
            mpfr_rootn_ui: (rop, op, k, rnd) => gmp.r_rootn_ui(rop, op, k, rnd),
            /** Set rop to the value of the Gamma function on op rounded in the direction rnd. */
            mpfr_gamma: (rop, op, rnd) => gmp.r_gamma(rop, op, rnd),
            /** Set rop to the value of the incomplete Gamma function on op and op2, rounded in the direction rnd. */
            mpfr_gamma_inc: (rop, op, op2, rnd) => gmp.r_gamma_inc(rop, op, op2, rnd),
            /** Set rop to the value of the Beta function at arguments op1 and op2, rounded in the direction rnd. */
            mpfr_beta: (rop, op1, op2, rnd) => gmp.r_beta(rop, op1, op2, rnd),
            /** Set rop to the value of the logarithm of the Gamma function on op rounded in the direction rnd. */
            mpfr_lngamma: (rop, op, rnd) => gmp.r_lngamma(rop, op, rnd),
            /** Set rop to the value of the logarithm of the absolute value of the Gamma function on op rounded in the direction rnd. */
            mpfr_lgamma: (rop, signp, op, rnd) => gmp.r_lgamma(rop, signp, op, rnd),
            /** Set rop to the value of the Digamma (sometimes also called Psi) function on op rounded in the direction rnd. */
            mpfr_digamma: (rop, op, rnd) => gmp.r_digamma(rop, op, rnd),
            /** Set rop to the value of the Riemann Zeta function on op rounded in the direction rnd. */
            mpfr_zeta: (rop, op, rnd) => gmp.r_zeta(rop, op, rnd),
            /** Set rop to the value of the Riemann Zeta function on op rounded in the direction rnd. */
            mpfr_zeta_ui: (rop, op, rnd) => gmp.r_zeta_ui(rop, op, rnd),
            /** Set rop to the factorial of op rounded in the direction rnd. */
            mpfr_fac_ui: (rop, op, rnd) => gmp.r_fac_ui(rop, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order 0 on op rounded in the direction rnd. */
            mpfr_j0: (rop, op, rnd) => gmp.r_j0(rop, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order 1 on op rounded in the direction rnd. */
            mpfr_j1: (rop, op, rnd) => gmp.r_j1(rop, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order n on op rounded in the direction rnd. */
            mpfr_jn: (rop, n, op, rnd) => gmp.r_jn(rop, n, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order 0 on op rounded in the direction rnd. */
            mpfr_y0: (rop, op, rnd) => gmp.r_y0(rop, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order 1 on op rounded in the direction rnd. */
            mpfr_y1: (rop, op, rnd) => gmp.r_y1(rop, op, rnd),
            /** Set rop to the value of the first kind Bessel function of order n on op rounded in the direction rnd. */
            mpfr_yn: (rop, n, op, rnd) => gmp.r_yn(rop, n, op, rnd),
            /** Set rop to the value of the Airy function Ai on x rounded in the direction rnd. */
            mpfr_ai: (rop, x, rnd) => gmp.r_ai(rop, x, rnd),
            /** Set rop to the minimum of op1 and op2. */
            mpfr_min: (rop, op1, op2, rnd) => gmp.r_min(rop, op1, op2, rnd),
            /** Set rop to the maximum of op1 and op2. */
            mpfr_max: (rop, op1, op2, rnd) => gmp.r_max(rop, op1, op2, rnd),
            /** Set rop to the positive difference of op1 and op2, i.e., op1 - op2 rounded in the direction rnd if op1 > op2, +0 if op1 ≤ op2, and NaN if op1 or op2 is NaN. */
            mpfr_dim: (rop, op1, op2, rnd) => gmp.r_dim(rop, op1, op2, rnd),
            /** Set rop to op1 * op2 rounded in the direction rnd. */
            mpfr_mul_z: (rop, op1, op2, rnd) => gmp.r_mul_z(rop, op1, op2, rnd),
            /** Set rop to op1 / op2 rounded in the direction rnd. */
            mpfr_div_z: (rop, op1, op2, rnd) => gmp.r_div_z(rop, op1, op2, rnd),
            /** Set rop to op1 + op2 rounded in the direction rnd. */
            mpfr_add_z: (rop, op1, op2, rnd) => gmp.r_add_z(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_sub_z: (rop, op1, op2, rnd) => gmp.r_sub_z(rop, op1, op2, rnd),
            /** Set rop to op1 - op2 rounded in the direction rnd. */
            mpfr_z_sub: (rop, op1, op2, rnd) => gmp.r_z_sub(rop, op1, op2, rnd),
            /** Compare op1 and op2. */
            mpfr_cmp_z: (op1, op2) => gmp.r_cmp_z(op1, op2),
            /** Set rop to (op1 * op2) + op3 rounded in the direction rnd. */
            mpfr_fma: (rop, op1, op2, op3, rnd) => gmp.r_fma(rop, op1, op2, op3, rnd),
            /** Set rop to (op1 * op2) - op3 rounded in the direction rnd. */
            mpfr_fms: (rop, op1, op2, op3, rnd) => gmp.r_fms(rop, op1, op2, op3, rnd),
            /** Set rop to (op1 * op2) + (op3 * op4) rounded in the direction rnd. */
            mpfr_fmma: (rop, op1, op2, op3, op4, rnd) => gmp.r_fmma(rop, op1, op2, op3, op4, rnd),
            /** Set rop to (op1 * op2) - (op3 * op4) rounded in the direction rnd. */
            mpfr_fmms: (rop, op1, op2, op3, op4, rnd) => gmp.r_fmms(rop, op1, op2, op3, op4, rnd),
            /** Set rop to the sum of all elements of tab, whose size is n, correctly rounded in the direction rnd. */
            mpfr_sum: (rop, tab, n, rnd) => gmp.r_sum(rop, tab, n, rnd),
            /** Set rop to the dot product of elements of a by those of b, whose common size is n, correctly rounded in the direction rnd. */
            mpfr_dot: (rop, a, b, n, rnd) => gmp.r_dot(rop, a, b, n, rnd),
            /** Free all caches and pools used by MPFR internally. */
            mpfr_free_cache: () => { gmp.r_free_cache(); },
            /** Free various caches and pools used by MPFR internally, as specified by way, which is a set of flags */
            mpfr_free_cache2: (way) => { gmp.r_free_cache2(way); },
            /** Free the pools used by MPFR internally. */
            mpfr_free_pool: () => { gmp.r_free_pool(); },
            /** This function should be called before calling mp_set_memory_functions(allocate_function, reallocate_function, free_function). */
            mpfr_mp_memory_cleanup: () => gmp.r_mp_memory_cleanup(),
            /** This function rounds x emulating subnormal number arithmetic. */
            mpfr_subnormalize: (x, t, rnd) => gmp.r_subnormalize(x, t, rnd),
            /** Read a floating-point number from a string nptr in base base, rounded in the direction rnd. */
            mpfr_strtofr: (rop, nptr, endptr, base, rnd) => gmp.r_strtofr(rop, nptr, endptr, base, rnd),
            /** Return the needed size in bytes to store the significand of a floating-point number of precision prec. */
            mpfr_custom_get_size: (prec) => gmp.r_custom_get_size(prec),
            /** Initialize a significand of precision prec. */
            mpfr_custom_init: (significand, prec) => { gmp.r_custom_init(significand, prec); },
            /** Return a pointer to the significand used by a mpfr_t initialized with mpfr_custom_init_set. */
            mpfr_custom_get_significand: (x) => gmp.r_custom_get_significand(x),
            /** Return the exponent of x */
            mpfr_custom_get_exp: (x) => gmp.r_custom_get_exp(x),
            /** Inform MPFR that the significand of x has moved due to a garbage collect and update its new position to new_position. */
            mpfr_custom_move: (x, new_position) => { gmp.r_custom_move(x, new_position); },
            /** Perform a dummy initialization of a mpfr_t. */
            mpfr_custom_init_set: (x, kind, exp, prec, significand) => { gmp.r_custom_init_set(x, kind, exp, prec, significand); },
            /** Return the current kind of a mpfr_t as created by mpfr_custom_init_set. */
            mpfr_custom_get_kind: (x) => gmp.r_custom_get_kind(x),
            /** This function implements the totalOrder predicate from IEEE 754-2008, where -NaN < -Inf < negative finite numbers < -0 < +0 < positive finite numbers < +Inf < +NaN. It returns a non-zero value (true) when x is smaller than or equal to y for this order relation, and zero (false) otherwise */
            mpfr_total_order_p: (x, y) => gmp.r_total_order_p(x, y),
        };
    });
}

const decoder$1 = new TextDecoder();
var DivMode;
(function (DivMode) {
    DivMode[DivMode["CEIL"] = 0] = "CEIL";
    DivMode[DivMode["FLOOR"] = 1] = "FLOOR";
    DivMode[DivMode["TRUNCATE"] = 2] = "TRUNCATE";
})(DivMode || (DivMode = {}));
const INVALID_PARAMETER_ERROR$1 = 'Invalid parameter!';
function getIntegerContext(gmp, ctx) {
    const mpz_t_arr = [];
    const isInteger = (val) => ctx.intContext.isInteger(val);
    const isRational = (val) => ctx.rationalContext.isRational(val);
    const isFloat = (val) => ctx.floatContext.isFloat(val);
    const compare = (mpz_t, val) => {
        if (typeof val === 'number') {
            assertInt32(val);
            return gmp.mpz_cmp_si(mpz_t, val);
        }
        if (typeof val === 'string') {
            const i = IntegerFn(val);
            return gmp.mpz_cmp(mpz_t, i.mpz_t);
        }
        if (isInteger(val)) {
            return gmp.mpz_cmp(mpz_t, val.mpz_t);
        }
        if (isRational(val)) {
            return -gmp.mpq_cmp_z(val.mpq_t, mpz_t);
        }
        if (isFloat(val)) {
            return -gmp.mpfr_cmp_z(val.mpfr_t, mpz_t);
        }
        throw new Error(INVALID_PARAMETER_ERROR$1);
    };
    const IntPrototype = {
        mpz_t: 0,
        type: 'integer',
        /** Returns the sum of this number and the given one. */
        add(val) {
            if (typeof val === 'number') {
                assertInt32(val);
                const n = IntegerFn();
                if (val < 0) {
                    gmp.mpz_sub_ui(n.mpz_t, this.mpz_t, -val);
                }
                else {
                    gmp.mpz_add_ui(n.mpz_t, this.mpz_t, val);
                }
                return n;
            }
            if (typeof val === 'string') {
                const n = IntegerFn(val);
                gmp.mpz_add(n.mpz_t, this.mpz_t, n.mpz_t);
                return n;
            }
            if (isInteger(val)) {
                const n = IntegerFn();
                gmp.mpz_add(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            if (isRational(val) || isFloat(val)) {
                return val.add(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the difference of this number and the given one. */
        sub(val) {
            if (typeof val === 'number') {
                const n = IntegerFn();
                assertInt32(val);
                if (val < 0) {
                    gmp.mpz_add_ui(n.mpz_t, this.mpz_t, -val);
                }
                else {
                    gmp.mpz_sub_ui(n.mpz_t, this.mpz_t, val);
                }
                return n;
            }
            if (typeof val === 'string') {
                const n = IntegerFn(val);
                gmp.mpz_sub(n.mpz_t, this.mpz_t, n.mpz_t);
                return n;
            }
            if (isInteger(val)) {
                const n = IntegerFn();
                gmp.mpz_sub(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            if (isRational(val) || isFloat(val)) {
                return val.neg().add(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the product of this number and the given one. */
        mul(val) {
            if (typeof val === 'number') {
                const n = IntegerFn();
                assertInt32(val);
                gmp.mpz_mul_si(n.mpz_t, this.mpz_t, val);
                return n;
            }
            if (typeof val === 'string') {
                const n = IntegerFn(val);
                gmp.mpz_mul(n.mpz_t, this.mpz_t, n.mpz_t);
                return n;
            }
            if (isInteger(val)) {
                const n = IntegerFn();
                gmp.mpz_mul(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            if (isRational(val) || isFloat(val)) {
                return val.mul(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the number with inverted sign. */
        neg() {
            const n = IntegerFn();
            gmp.mpz_neg(n.mpz_t, this.mpz_t);
            return n;
        },
        /** Returns the absolute value of this number. */
        abs() {
            const n = IntegerFn();
            gmp.mpz_abs(n.mpz_t, this.mpz_t);
            return n;
        },
        /** Returns the result of the division of this number by the given one. */
        div(val, mode = DivMode.CEIL) {
            if (typeof val === 'number') {
                const n = IntegerFn(this);
                assertInt32(val);
                if (val < 0) {
                    gmp.mpz_neg(n.mpz_t, n.mpz_t);
                    val = -val;
                }
                if (mode === DivMode.CEIL) {
                    gmp.mpz_cdiv_q_ui(n.mpz_t, n.mpz_t, val);
                }
                else if (mode === DivMode.FLOOR) {
                    gmp.mpz_fdiv_q_ui(n.mpz_t, n.mpz_t, val);
                }
                else if (mode === DivMode.TRUNCATE) {
                    gmp.mpz_tdiv_q_ui(n.mpz_t, n.mpz_t, val);
                }
                return n;
            }
            if (typeof val === 'string' || isInteger(val)) {
                const n = IntegerFn(this);
                const intVal = typeof val === 'string' ? IntegerFn(val) : val;
                if (mode === DivMode.CEIL) {
                    gmp.mpz_cdiv_q(n.mpz_t, this.mpz_t, intVal.mpz_t);
                }
                else if (mode === DivMode.FLOOR) {
                    gmp.mpz_fdiv_q(n.mpz_t, this.mpz_t, intVal.mpz_t);
                }
                else if (mode === DivMode.TRUNCATE) {
                    gmp.mpz_tdiv_q(n.mpz_t, this.mpz_t, intVal.mpz_t);
                }
                return n;
            }
            if (isRational(val)) {
                return val.invert().mul(this);
            }
            if (isFloat(val)) {
                return ctx.floatContext.Float(this).div(val);
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns this number exponentiated to the given value. */
        pow(exp, mod) {
            if (typeof exp === 'number') {
                const n = IntegerFn();
                assertUint32(exp);
                if (mod !== undefined) {
                    if (typeof mod === 'number') {
                        assertUint32(mod);
                        gmp.mpz_powm_ui(n.mpz_t, this.mpz_t, exp, IntegerFn(mod).mpz_t);
                    }
                    else {
                        gmp.mpz_powm_ui(n.mpz_t, this.mpz_t, exp, mod.mpz_t);
                    }
                }
                else {
                    gmp.mpz_pow_ui(n.mpz_t, this.mpz_t, exp);
                }
                return n;
            }
            if (isInteger(exp)) {
                const n = IntegerFn();
                if (mod !== undefined) {
                    if (typeof mod === 'number') {
                        assertUint32(mod);
                        gmp.mpz_powm(n.mpz_t, this.mpz_t, exp.mpz_t, IntegerFn(mod).mpz_t);
                    }
                    else {
                        gmp.mpz_powm(n.mpz_t, this.mpz_t, exp.mpz_t, mod.mpz_t);
                    }
                }
                else {
                    const expNum = exp.toNumber();
                    assertUint32(expNum);
                    gmp.mpz_pow_ui(n.mpz_t, this.mpz_t, expNum);
                }
                return n;
            }
            if (isRational(exp) && mod === undefined) {
                const n = IntegerFn();
                const numerator = exp.numerator().toNumber();
                assertUint32(numerator);
                const denominator = exp.denominator().toNumber();
                assertUint32(denominator);
                gmp.mpz_pow_ui(n.mpz_t, this.mpz_t, numerator);
                gmp.mpz_root(n.mpz_t, n.mpz_t, denominator);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the integer square root number of this number, rounded down. */
        sqrt() {
            const n = IntegerFn();
            gmp.mpz_sqrt(n.mpz_t, this.mpz_t);
            return n;
        },
        nthRoot(nth) {
            const n = IntegerFn();
            assertUint32(nth);
            gmp.mpz_root(n.mpz_t, this.mpz_t, nth);
            return n;
        },
        factorial() {
            if (gmp.mpz_fits_ulong_p(this.mpz_t) === 0) {
                throw new Error('Out of bounds!');
            }
            const n = IntegerFn();
            const value = gmp.mpz_get_ui(this.mpz_t);
            gmp.mpz_fac_ui(n.mpz_t, value);
            return n;
        },
        doubleFactorial() {
            if (gmp.mpz_fits_ulong_p(this.mpz_t) === 0) {
                throw new Error('Out of bounds!');
            }
            const n = IntegerFn();
            const value = gmp.mpz_get_ui(this.mpz_t);
            gmp.mpz_2fac_ui(n.mpz_t, value);
            return n;
        },
        isPrime(reps = 20) {
            assertUint32(reps);
            const ret = gmp.mpz_probab_prime_p(this.mpz_t, reps);
            if (ret === 0)
                return false; // definitely non-prime
            if (ret === 1)
                return 'probably-prime';
            if (ret === 2)
                return true; // definitely prime
        },
        nextPrime() {
            const n = IntegerFn();
            gmp.mpz_nextprime(n.mpz_t, this.mpz_t);
            return n;
        },
        /** Returns the greatest common divisor of this number and the given one. */
        gcd(val) {
            const n = IntegerFn();
            if (typeof val === 'number') {
                assertUint32(val);
                gmp.mpz_gcd_ui(n.mpz_t, this.mpz_t, val);
                return n;
            }
            if (isInteger(val)) {
                gmp.mpz_gcd(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        lcm(val) {
            const n = IntegerFn();
            if (typeof val === 'number') {
                assertUint32(val);
                gmp.mpz_lcm_ui(n.mpz_t, this.mpz_t, val);
                return n;
            }
            if (isInteger(val)) {
                gmp.mpz_lcm(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        complement1() {
            const n = IntegerFn();
            gmp.mpz_com(n.mpz_t, this.mpz_t);
            return n;
        },
        complement2() {
            const n = IntegerFn();
            gmp.mpz_com(n.mpz_t, this.mpz_t);
            gmp.mpz_add_ui(n.mpz_t, n.mpz_t, 1);
            return n;
        },
        /** Returns the integer bitwise-and combined with another integer. */
        and(val) {
            const n = IntegerFn();
            if (typeof val === 'number') {
                assertUint32(val);
                gmp.mpz_and(n.mpz_t, this.mpz_t, IntegerFn(val).mpz_t);
                return n;
            }
            if (isInteger(val)) {
                gmp.mpz_and(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the integer bitwise-or combined with another integer. */
        or(val) {
            const n = IntegerFn();
            if (typeof val === 'number') {
                assertUint32(val);
                gmp.mpz_ior(n.mpz_t, this.mpz_t, IntegerFn(val).mpz_t);
                return n;
            }
            if (isInteger(val)) {
                gmp.mpz_ior(n.mpz_t, this.mpz_t, val.mpz_t);
                return n;
            }
            throw new Error(INVALID_PARAMETER_ERROR$1);
        },
        /** Returns the integer bitwise-xor combined with another integer. */
        xor(val) {
            const n = IntegerFn();
            if (typeof val === 'number') {
                assertUint32(val);
                gmp.mpz_xor(n.mpz_t, this.mpz_t, IntegerFn(val).mpz_t);
            }
            else {
                gmp.mpz_xor(n.mpz_t, this.mpz_t, val.mpz_t);
            }
            return n;
        },
        /** Returns the integer left shifted by a given number of bits. */
        shiftLeft(val) {
            assertUint32(val);
            const n = IntegerFn();
            gmp.mpz_mul_2exp(n.mpz_t, this.mpz_t, val);
            return n;
        },
        /** Returns the integer right shifted by a given number of bits. */
        shiftRight(val) {
            assertUint32(val);
            const n = IntegerFn();
            gmp.mpz_fdiv_q_2exp(n.mpz_t, this.mpz_t, val);
            return n;
        },
        /** Sets the value of bit i to 1. The least significant bit is number 0 */
        setBit(i) {
            const n = IntegerFn(this);
            assertUint32(i);
            gmp.mpz_setbit(n.mpz_t, i);
            return n;
        },
        /** Sets the value of multiple bits to 1. The least significant bit is number 0 */
        setBits(indices) {
            const n = IntegerFn(this);
            assertArray(indices);
            indices.forEach(i => {
                assertUint32(i);
                gmp.mpz_setbit(n.mpz_t, i);
            });
            return n;
        },
        /** Sets the value of bit i to 0. The least significant bit is number 0 */
        clearBit(index) {
            const n = IntegerFn(this);
            assertUint32(index);
            gmp.mpz_clrbit(n.mpz_t, index);
            return n;
        },
        /** Sets the value of multiple bits to 0. The least significant bit is number 0 */
        clearBits(indices) {
            const n = IntegerFn(this);
            assertArray(indices);
            indices.forEach(i => {
                assertUint32(i);
                gmp.mpz_clrbit(n.mpz_t, i);
            });
            return n;
        },
        /** Inverts the value of bit i. The least significant bit is number 0 */
        flipBit(index) {
            const n = IntegerFn(this);
            assertUint32(index);
            gmp.mpz_combit(n.mpz_t, index);
            return n;
        },
        /** Inverts the value of multiple bits. The least significant bit is number 0 */
        flipBits(indices) {
            const n = IntegerFn(this);
            assertArray(indices);
            indices.forEach(i => {
                assertUint32(i);
                gmp.mpz_combit(n.mpz_t, i);
            });
            return n;
        },
        /** Returns 0 or 1 based on the value of a bit at the provided index. The least significant bit is number 0 */
        getBit(index) {
            assertUint32(index);
            return gmp.mpz_tstbit(this.mpz_t, index);
        },
        // Returns the position of the most significant bit. The least significant bit is number 0.
        msbPosition() {
            return gmp.mpz_sizeinbase(this.mpz_t, 2) - 1;
        },
        /** Works similarly to JS Array.slice() but on bits. The least significant bit is number 0 */
        sliceBits(start, end) {
            if (start === undefined)
                start = 0;
            assertInt32(start);
            const msb = gmp.mpz_sizeinbase(this.mpz_t, 2);
            if (start < 0)
                start = msb + start;
            start = Math.max(0, start);
            if (end === undefined)
                end = msb + 1;
            assertInt32(end);
            if (end < 0)
                end = msb + end;
            end = Math.min(msb + 1, end);
            if (start >= end)
                return IntegerFn(0);
            const n = IntegerFn(1);
            if (end < msb + 1) {
                gmp.mpz_mul_2exp(n.mpz_t, n.mpz_t, end);
                gmp.mpz_sub_ui(n.mpz_t, n.mpz_t, 1);
                gmp.mpz_and(n.mpz_t, this.mpz_t, n.mpz_t);
                gmp.mpz_fdiv_q_2exp(n.mpz_t, n.mpz_t, start);
            }
            else {
                gmp.mpz_fdiv_q_2exp(n.mpz_t, this.mpz_t, start);
            }
            return n;
        },
        /** Creates new integer with the copy of binary representation of num to position offset. Optionally bitCount can be used to zero-pad the number to a specific number of bits. The least significant bit is number 0 */
        writeTo(num, offset = 0, bitCount) {
            assertUint32(offset);
            if (!isInteger(num))
                throw new Error('Only Integers are supported');
            if (bitCount === undefined) {
                bitCount = gmp.mpz_sizeinbase(num.mpz_t, 2);
            }
            assertUint32(bitCount);
            const aux = IntegerFn();
            const n = IntegerFn();
            gmp.mpz_fdiv_q_2exp(n.mpz_t, this.mpz_t, offset + bitCount);
            gmp.mpz_mul_2exp(n.mpz_t, n.mpz_t, bitCount);
            gmp.mpz_tdiv_r_2exp(aux.mpz_t, num.mpz_t, bitCount);
            gmp.mpz_ior(n.mpz_t, n.mpz_t, aux.mpz_t);
            gmp.mpz_tdiv_r_2exp(aux.mpz_t, this.mpz_t, offset);
            gmp.mpz_mul_2exp(n.mpz_t, n.mpz_t, offset);
            gmp.mpz_ior(n.mpz_t, n.mpz_t, aux.mpz_t);
            return n;
        },
        isEqual(val) {
            return compare(this.mpz_t, val) === 0;
        },
        lessThan(val) {
            return compare(this.mpz_t, val) < 0;
        },
        lessOrEqual(val) {
            return compare(this.mpz_t, val) <= 0;
        },
        greaterThan(val) {
            return compare(this.mpz_t, val) > 0;
        },
        greaterOrEqual(val) {
            return compare(this.mpz_t, val) >= 0;
        },
        sign() {
            return gmp.mpz_sgn(this.mpz_t);
        },
        toNumber() {
            if (gmp.mpz_fits_slong_p(this.mpz_t) === 0) {
                return gmp.mpz_get_d(this.mpz_t);
            }
            return gmp.mpz_get_si(this.mpz_t);
        },
        /** Exports integer into an Uint8Array. Sign is ignored. */
        toBuffer(littleEndian = false) {
            const countPtr = gmp.malloc(4);
            const startptr = gmp.mpz_export(0, countPtr, littleEndian ? -1 : 1, 1, 1, 0, this.mpz_t);
            const size = gmp.memView.getUint32(countPtr, true);
            const endptr = startptr + size;
            const buf = gmp.mem.slice(startptr, endptr);
            gmp.free(startptr);
            gmp.free(countPtr);
            return buf;
        },
        toString(radix = 10) {
            if (!Number.isSafeInteger(radix) || radix < 2 || radix > 62) {
                throw new Error('radix must have a value between 2 and 62');
            }
            const strptr = gmp.mpz_get_str(0, radix, this.mpz_t);
            const endptr = gmp.mem.indexOf(0, strptr);
            const str = decoder$1.decode(gmp.mem.subarray(strptr, endptr));
            gmp.free(strptr);
            return str;
        },
        toRational() {
            return ctx.rationalContext.Rational(this);
        },
        toFloat() {
            return ctx.floatContext.Float(this);
        },
    };
    const IntegerFn = (num, radix = 10) => {
        const instance = Object.create(IntPrototype);
        instance.mpz_t = gmp.mpz_t();
        if (num === undefined) {
            gmp.mpz_init(instance.mpz_t);
        }
        else if (typeof num === 'string') {
            if (!Number.isSafeInteger(radix) || radix < 2 || radix > 36) {
                throw new Error('radix must have a value between 2 and 36');
            }
            const strPtr = gmp.malloc_cstr(num);
            const res = gmp.mpz_init_set_str(instance.mpz_t, strPtr, radix);
            gmp.free(strPtr);
            if (res !== 0) {
                throw new Error('Invalid number provided!');
            }
        }
        else if (typeof num === 'number') {
            assertInt32(num);
            gmp.mpz_init_set_si(instance.mpz_t, num);
        }
        else if (isInteger(num)) {
            gmp.mpz_init_set(instance.mpz_t, num.mpz_t);
        }
        else if (ArrayBuffer.isView(num)) {
            if (!(num instanceof Uint8Array)) {
                throw new Error('Only Uint8Array is supported!');
            }
            const wasmBufPtr = gmp.malloc(num.length);
            gmp.mem.set(num, wasmBufPtr);
            gmp.mpz_import(instance.mpz_t, num.length, 1, 1, 1, 0, wasmBufPtr);
            gmp.free(wasmBufPtr);
        }
        else if (isRational(num)) {
            const f = ctx.floatContext.Float(num);
            gmp.mpfr_get_z(instance.mpz_t, f.mpfr_t, 0);
        }
        else if (isFloat(num)) {
            gmp.mpfr_get_z(instance.mpz_t, num.mpfr_t, num.rndMode);
        }
        else {
            gmp.mpz_t_free(instance.mpz_t);
            throw new Error('Invalid value for the Integer type!');
        }
        mpz_t_arr.push(instance.mpz_t);
        return instance;
    };
    return {
        Integer: IntegerFn,
        isInteger: (val) => IntPrototype.isPrototypeOf(val),
        destroy: () => {
            for (let i = mpz_t_arr.length - 1; i >= 0; i--) {
                gmp.mpz_clear(mpz_t_arr[i]);
                gmp.mpz_t_free(mpz_t_arr[i]);
            }
            mpz_t_arr.length = 0;
        }
    };
}

const decoder = new TextDecoder();
const INVALID_PARAMETER_ERROR = 'Invalid parameter!';
function getRationalContext(gmp, ctx) {
    const mpq_t_arr = [];
    const isInteger = (val) => ctx.intContext.isInteger(val);
    const isRational = (val) => ctx.rationalContext.isRational(val);
    const isFloat = (val) => ctx.floatContext.isFloat(val);
    const compare = (mpq_t, val) => {
        if (typeof val === 'number') {
            assertInt32(val);
            return gmp.mpq_cmp_si(mpq_t, val, 1);
        }
        if (typeof val === 'string') {
            const r = RationalFn(val);
            return gmp.mpq_cmp(mpq_t, r.mpq_t);
        }
        if (isInteger(val)) {
            return gmp.mpq_cmp_z(mpq_t, val.mpz_t);
        }
        if (isRational(val)) {
            return gmp.mpq_cmp(mpq_t, val.mpq_t);
        }
        if (isFloat(val)) {
            return -gmp.mpfr_cmp_q(val.mpfr_t, mpq_t);
        }
        throw new Error(INVALID_PARAMETER_ERROR);
    };
    const RationalPrototype = {
        mpq_t: 0,
        type: 'rational',
        /** Returns the sum of this number and the given one. */
        add(val) {
            if (typeof val === 'number' || isInteger(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_add(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
                return n;
            }
            if (typeof val === 'string') {
                const n = RationalFn(val);
                gmp.mpq_add(n.mpq_t, this.mpq_t, n.mpq_t);
                return n;
            }
            if (isRational(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_add(n.mpq_t, this.mpq_t, val.mpq_t);
                return n;
            }
            if (isFloat(val)) {
                return val.add(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR);
        },
        /** Returns the difference of this number and the given one. */
        sub(val) {
            if (typeof val === 'number' || isInteger(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_sub(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
                return n;
            }
            if (typeof val === 'string') {
                const n = RationalFn(val);
                gmp.mpq_sub(n.mpq_t, this.mpq_t, n.mpq_t);
                return n;
            }
            if (isRational(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_sub(n.mpq_t, this.mpq_t, val.mpq_t);
                return n;
            }
            if (isFloat(val)) {
                return val.neg().add(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR);
        },
        /** Returns the product of this number and the given one. */
        mul(val) {
            if (typeof val === 'number' || isInteger(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_mul(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
                return n;
            }
            if (typeof val === 'string') {
                const n = RationalFn(val);
                gmp.mpq_mul(n.mpq_t, this.mpq_t, n.mpq_t);
                return n;
            }
            if (isRational(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_mul(n.mpq_t, this.mpq_t, val.mpq_t);
                return n;
            }
            if (isFloat(val)) {
                return val.mul(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR);
        },
        /** Returns the number with inverted sign. */
        neg() {
            const n = RationalFn(0, 1);
            gmp.mpq_neg(n.mpq_t, this.mpq_t);
            return n;
        },
        invert() {
            const n = RationalFn(0, 1);
            gmp.mpq_inv(n.mpq_t, this.mpq_t);
            return n;
        },
        /** Returns the absolute value of this number. */
        abs() {
            const n = RationalFn(0, 1);
            gmp.mpq_abs(n.mpq_t, this.mpq_t);
            return n;
        },
        /** Returns the result of the division of this number by the given one. */
        div(val) {
            if (typeof val === 'number' || isInteger(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_div(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
                return n;
            }
            if (typeof val === 'string') {
                const n = RationalFn(val);
                gmp.mpq_div(n.mpq_t, this.mpq_t, n.mpq_t);
                return n;
            }
            if (isRational(val)) {
                const n = RationalFn(0, 1);
                gmp.mpq_div(n.mpq_t, this.mpq_t, val.mpq_t);
                return n;
            }
            if (isFloat(val)) {
                return ctx.floatContext.Float(this).div(val);
            }
            throw new Error(INVALID_PARAMETER_ERROR);
        },
        isEqual(val) {
            if (typeof val === 'number' || isInteger(val)) {
                return gmp.mpq_equal(this.mpq_t, RationalFn(val).mpq_t) !== 0;
            }
            if (typeof val === 'string') {
                const n = RationalFn(val);
                return gmp.mpq_equal(this.mpq_t, n.mpq_t) !== 0;
            }
            if (isRational(val)) {
                return gmp.mpq_equal(this.mpq_t, val.mpq_t) !== 0;
            }
            if (isFloat(val)) {
                return val.isEqual(this);
            }
            throw new Error(INVALID_PARAMETER_ERROR);
        },
        lessThan(val) {
            return compare(this.mpq_t, val) < 0;
        },
        lessOrEqual(val) {
            return compare(this.mpq_t, val) <= 0;
        },
        greaterThan(val) {
            return compare(this.mpq_t, val) > 0;
        },
        greaterOrEqual(val) {
            return compare(this.mpq_t, val) >= 0;
        },
        numerator() {
            const n = ctx.intContext.Integer();
            gmp.mpq_get_num(n.mpz_t, this.mpq_t);
            return n;
        },
        denominator() {
            const n = ctx.intContext.Integer();
            gmp.mpq_get_den(n.mpz_t, this.mpq_t);
            return n;
        },
        sign() {
            return gmp.mpq_sgn(this.mpq_t);
        },
        toNumber() {
            return gmp.mpq_get_d(this.mpq_t);
        },
        toString() {
            const strptr = gmp.mpq_get_str(0, 10, this.mpq_t);
            const endptr = gmp.mem.indexOf(0, strptr);
            const str = decoder.decode(gmp.mem.subarray(strptr, endptr));
            gmp.free(strptr);
            return str;
        },
        toInteger() {
            return ctx.intContext.Integer(this);
        },
        toFloat() {
            return ctx.floatContext.Float(this);
        },
    };
    const parseParameters = (mpq_t, p1, p2) => {
        if (typeof p1 === 'number' && (p2 === undefined || typeof p2 === 'number')) {
            assertInt32(p1);
            if (p2 !== undefined) {
                assertInt32(p2);
                gmp.mpq_set_si(mpq_t, p1, Math.abs(p2));
                if (p2 < 0) {
                    gmp.mpq_neg(mpq_t, mpq_t);
                }
            }
            else {
                gmp.mpq_set_si(mpq_t, p1, 1);
            }
            return;
        }
        if (isInteger(p1) && p2 === undefined) {
            gmp.mpq_set_z(mpq_t, p1.mpz_t);
            return;
        }
        if (isRational(p1) && p2 === undefined) {
            gmp.mpq_set(mpq_t, p1.mpq_t);
            return;
        }
        const finalString = p2 !== undefined ? `${p1.toString()}/${p2.toString()}` : p1.toString();
        const strPtr = gmp.malloc_cstr(finalString);
        gmp.mpq_set_str(mpq_t, strPtr, 10);
        gmp.free(strPtr);
    };
    const RationalFn = (p1, p2) => {
        const instance = Object.create(RationalPrototype);
        instance.mpq_t = gmp.mpq_t();
        gmp.mpq_init(instance.mpq_t);
        parseParameters(instance.mpq_t, p1, p2);
        gmp.mpq_canonicalize(instance.mpq_t);
        mpq_t_arr.push(instance.mpq_t);
        return instance;
    };
    return {
        Rational: RationalFn,
        isRational: (val) => RationalPrototype.isPrototypeOf(val),
        destroy: () => {
            for (let i = mpq_t_arr.length - 1; i >= 0; i--) {
                gmp.mpq_clear(mpq_t_arr[i]);
                gmp.mpq_t_free(mpq_t_arr[i]);
            }
            mpq_t_arr.length = 0;
        }
    };
}

function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const binding = yield getGMPInterface();
        const createContext = (options) => {
            const ctx = {
                intContext: null,
                rationalContext: null,
                floatContext: null,
            };
            ctx.intContext = getIntegerContext(binding, ctx);
            ctx.rationalContext = getRationalContext(binding, ctx);
            ctx.floatContext = getFloatContext(binding, ctx, options);
            return {
                types: {
                    Integer: ctx.intContext.Integer,
                    Rational: ctx.rationalContext.Rational,
                    Float: ctx.floatContext.Float,
                    Pi: ctx.floatContext.Pi,
                    EulerConstant: ctx.floatContext.EulerConstant,
                    EulerNumber: ctx.floatContext.EulerNumber,
                    Log2: ctx.floatContext.Log2,
                    Catalan: ctx.floatContext.Catalan,
                },
                destroy: () => {
                    ctx.intContext.destroy();
                    ctx.rationalContext.destroy();
                    ctx.floatContext.destroy();
                },
            };
        };
        return {
            binding,
            calculate: (fn, options = {}) => {
                const context = createContext(options);
                if (typeof fn !== 'function') {
                    throw new Error('calculate() requires a callback function');
                }
                const fnRes = fn(context.types);
                const res = fnRes === null || fnRes === void 0 ? void 0 : fnRes.toString();
                context.destroy();
                return res;
            },
            getContext: (options = {}) => {
                const context = createContext(options);
                return Object.assign(Object.assign({}, context.types), { destroy: context.destroy });
            },
            reset: () => __awaiter(this, void 0, void 0, function* () {
                return binding.reset();
            }),
        };
    });
}
const precisionToBits = (digits) => Math.ceil(digits * 3.3219281); // digits * log2(10)

export { DivMode, FloatRoundingMode, init, precisionToBits };
