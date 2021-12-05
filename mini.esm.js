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

const gmpWasmLength = 276921;
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
