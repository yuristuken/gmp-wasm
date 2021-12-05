import type { GMPFunctions } from './functions';
import { Integer } from './integer';
import { Rational } from './rational';
declare type FloatFactoryReturn = ReturnType<typeof getFloatContext>['Float'];
export interface FloatFactory extends FloatFactoryReturn {
}
declare type FloatReturn = ReturnType<FloatFactoryReturn>;
export interface Float extends FloatReturn {
}
declare type AllTypes = Integer | Rational | Float | string | number;
/** Represents the different rounding modes. */
export declare enum FloatRoundingMode {
    /** Round to nearest, with ties to even. MPFR_RNDN */
    ROUND_NEAREST = 0,
    /** Round toward zero. MPFR_RNDZ */
    ROUND_TO_ZERO = 1,
    /** Round toward +Infinity. MPFR_RNDU */
    ROUND_UP = 2,
    /** Round toward -Infinity. MPFR_RNDD */
    ROUND_DOWN = 3,
    /** Round away from zero. MPFR_RNDA */
    ROUND_FROM_ZERO = 4
}
export interface FloatOptions {
    precisionBits?: number;
    roundingMode?: FloatRoundingMode;
}
export declare function getFloatContext(gmp: GMPFunctions, ctx: any, ctxOptions?: FloatOptions): {
    Float: (val?: null | undefined | string | number | Float | Rational | Integer, options?: FloatOptions) => {
        mpfr_t: number;
        precisionBits: number;
        rndMode: number;
        type: string;
        readonly options: FloatOptions;
        readonly setOptions: FloatOptions;
        /** Returns the sum of this number and the given one. */
        add(val: AllTypes): Float;
        /** Returns the difference of this number and the given one. */
        sub(val: AllTypes): Float;
        /** Returns the product of this number and the given one. */
        mul(val: AllTypes): Float;
        /** Returns the result of the division of this number by the given one. */
        div(val: AllTypes): Float;
        /** Returns the integer square root number of this number. */
        sqrt(): Float;
        invSqrt(): Float;
        cbrt(): Float;
        nthRoot(nth: number): Float;
        /** Returns the number with inverted sign. */
        neg(): Float;
        /** Returns the absolute value of this number. */
        abs(): Float;
        factorial(): any;
        isInteger(): boolean;
        isZero(): boolean;
        isRegular(): boolean;
        isNumber(): boolean;
        isInfinite(): boolean;
        isNaN(): boolean;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        ln(): Float;
        log2(): Float;
        log10(): Float;
        exp(): Float;
        exp2(): Float;
        exp10(): Float;
        /** Returns this number exponentiated to the given value. */
        pow(val: Float | number): Float;
        sin(): Float;
        cos(): Float;
        tan(): Float;
        sec(): Float;
        csc(): Float;
        cot(): Float;
        acos(): Float;
        asin(): Float;
        atan(): Float;
        sinh(): Float;
        cosh(): Float;
        tanh(): Float;
        sech(): Float;
        csch(): Float;
        coth(): Float;
        acosh(): Float;
        asinh(): Float;
        atanh(): Float;
        /** Calculate exponential integral */
        eint(): Float;
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2(): Float;
        /** Calculate the value of the Gamma function. */
        gamma(): Float;
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma(): Float;
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma(): Float;
        /** Calculate the value of the Beta function */
        beta(op2: Float): Float;
        /** Calculate the value of the Riemann Zeta function */
        zeta(): Float;
        /** Calculate the value of the error function */
        erf(): Float;
        /** Calculate the value of the complementary error function */
        erfc(): Float;
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0(): Float;
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1(): Float;
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n: number): Float;
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0(): Float;
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1(): Float;
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n: number): Float;
        /** Calculate the arithmetic-geometric mean */
        agm(op2: Float): Float;
        /** Calculate the value of the Airy function Ai on x */
        ai(): Float;
        sign(): number;
        toNumber(): number;
        /** Rounds to the next higher or equal representable integer */
        ceil(): Float;
        /** Rounds to the next lower or equal representable integer */
        floor(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven(): Float;
        /** Rounds to the next representable integer toward zero */
        trunc(): Float;
        /** Round to precision */
        roundTo(prec: number): Float;
        /** Returns the fractional part */
        frac(): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y: Float): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y: Float): Float;
        nextAbove(): Float;
        nextBelow(): Float;
        exponent2(): number;
        toString(): string;
        toFixed(digits?: number): any;
        toInteger(): Integer;
        toRational(): Rational;
    };
    isFloat: (val: any) => boolean;
    Pi: (options?: FloatOptions) => {
        mpfr_t: number;
        precisionBits: number;
        rndMode: number;
        type: string;
        readonly options: FloatOptions;
        readonly setOptions: FloatOptions;
        /** Returns the sum of this number and the given one. */
        add(val: AllTypes): Float;
        /** Returns the difference of this number and the given one. */
        sub(val: AllTypes): Float;
        /** Returns the product of this number and the given one. */
        mul(val: AllTypes): Float;
        /** Returns the result of the division of this number by the given one. */
        div(val: AllTypes): Float;
        /** Returns the integer square root number of this number. */
        sqrt(): Float;
        invSqrt(): Float;
        cbrt(): Float;
        nthRoot(nth: number): Float;
        /** Returns the number with inverted sign. */
        neg(): Float;
        /** Returns the absolute value of this number. */
        abs(): Float;
        factorial(): any;
        isInteger(): boolean;
        isZero(): boolean;
        isRegular(): boolean;
        isNumber(): boolean;
        isInfinite(): boolean;
        isNaN(): boolean;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        ln(): Float;
        log2(): Float;
        log10(): Float;
        exp(): Float;
        exp2(): Float;
        exp10(): Float;
        /** Returns this number exponentiated to the given value. */
        pow(val: Float | number): Float;
        sin(): Float;
        cos(): Float;
        tan(): Float;
        sec(): Float;
        csc(): Float;
        cot(): Float;
        acos(): Float;
        asin(): Float;
        atan(): Float;
        sinh(): Float;
        cosh(): Float;
        tanh(): Float;
        sech(): Float;
        csch(): Float;
        coth(): Float;
        acosh(): Float;
        asinh(): Float;
        atanh(): Float;
        /** Calculate exponential integral */
        eint(): Float;
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2(): Float;
        /** Calculate the value of the Gamma function. */
        gamma(): Float;
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma(): Float;
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma(): Float;
        /** Calculate the value of the Beta function */
        beta(op2: Float): Float;
        /** Calculate the value of the Riemann Zeta function */
        zeta(): Float;
        /** Calculate the value of the error function */
        erf(): Float;
        /** Calculate the value of the complementary error function */
        erfc(): Float;
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0(): Float;
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1(): Float;
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n: number): Float;
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0(): Float;
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1(): Float;
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n: number): Float;
        /** Calculate the arithmetic-geometric mean */
        agm(op2: Float): Float;
        /** Calculate the value of the Airy function Ai on x */
        ai(): Float;
        sign(): number;
        toNumber(): number;
        /** Rounds to the next higher or equal representable integer */
        ceil(): Float;
        /** Rounds to the next lower or equal representable integer */
        floor(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven(): Float;
        /** Rounds to the next representable integer toward zero */
        trunc(): Float;
        /** Round to precision */
        roundTo(prec: number): Float;
        /** Returns the fractional part */
        frac(): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y: Float): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y: Float): Float;
        nextAbove(): Float;
        nextBelow(): Float;
        exponent2(): number;
        toString(): string;
        toFixed(digits?: number): any;
        toInteger(): Integer;
        toRational(): Rational;
    };
    EulerConstant: (options?: FloatOptions) => {
        mpfr_t: number;
        precisionBits: number;
        rndMode: number;
        type: string;
        readonly options: FloatOptions;
        readonly setOptions: FloatOptions;
        /** Returns the sum of this number and the given one. */
        add(val: AllTypes): Float;
        /** Returns the difference of this number and the given one. */
        sub(val: AllTypes): Float;
        /** Returns the product of this number and the given one. */
        mul(val: AllTypes): Float;
        /** Returns the result of the division of this number by the given one. */
        div(val: AllTypes): Float;
        /** Returns the integer square root number of this number. */
        sqrt(): Float;
        invSqrt(): Float;
        cbrt(): Float;
        nthRoot(nth: number): Float;
        /** Returns the number with inverted sign. */
        neg(): Float;
        /** Returns the absolute value of this number. */
        abs(): Float;
        factorial(): any;
        isInteger(): boolean;
        isZero(): boolean;
        isRegular(): boolean;
        isNumber(): boolean;
        isInfinite(): boolean;
        isNaN(): boolean;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        ln(): Float;
        log2(): Float;
        log10(): Float;
        exp(): Float;
        exp2(): Float;
        exp10(): Float;
        /** Returns this number exponentiated to the given value. */
        pow(val: Float | number): Float;
        sin(): Float;
        cos(): Float;
        tan(): Float;
        sec(): Float;
        csc(): Float;
        cot(): Float;
        acos(): Float;
        asin(): Float;
        atan(): Float;
        sinh(): Float;
        cosh(): Float;
        tanh(): Float;
        sech(): Float;
        csch(): Float;
        coth(): Float;
        acosh(): Float;
        asinh(): Float;
        atanh(): Float;
        /** Calculate exponential integral */
        eint(): Float;
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2(): Float;
        /** Calculate the value of the Gamma function. */
        gamma(): Float;
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma(): Float;
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma(): Float;
        /** Calculate the value of the Beta function */
        beta(op2: Float): Float;
        /** Calculate the value of the Riemann Zeta function */
        zeta(): Float;
        /** Calculate the value of the error function */
        erf(): Float;
        /** Calculate the value of the complementary error function */
        erfc(): Float;
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0(): Float;
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1(): Float;
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n: number): Float;
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0(): Float;
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1(): Float;
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n: number): Float;
        /** Calculate the arithmetic-geometric mean */
        agm(op2: Float): Float;
        /** Calculate the value of the Airy function Ai on x */
        ai(): Float;
        sign(): number;
        toNumber(): number;
        /** Rounds to the next higher or equal representable integer */
        ceil(): Float;
        /** Rounds to the next lower or equal representable integer */
        floor(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven(): Float;
        /** Rounds to the next representable integer toward zero */
        trunc(): Float;
        /** Round to precision */
        roundTo(prec: number): Float;
        /** Returns the fractional part */
        frac(): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y: Float): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y: Float): Float;
        nextAbove(): Float;
        nextBelow(): Float;
        exponent2(): number;
        toString(): string;
        toFixed(digits?: number): any;
        toInteger(): Integer;
        toRational(): Rational;
    };
    EulerNumber: (options?: FloatOptions) => Float;
    Log2: (options?: FloatOptions) => {
        mpfr_t: number;
        precisionBits: number;
        rndMode: number;
        type: string;
        readonly options: FloatOptions;
        readonly setOptions: FloatOptions;
        /** Returns the sum of this number and the given one. */
        add(val: AllTypes): Float;
        /** Returns the difference of this number and the given one. */
        sub(val: AllTypes): Float;
        /** Returns the product of this number and the given one. */
        mul(val: AllTypes): Float;
        /** Returns the result of the division of this number by the given one. */
        div(val: AllTypes): Float;
        /** Returns the integer square root number of this number. */
        sqrt(): Float;
        invSqrt(): Float;
        cbrt(): Float;
        nthRoot(nth: number): Float;
        /** Returns the number with inverted sign. */
        neg(): Float;
        /** Returns the absolute value of this number. */
        abs(): Float;
        factorial(): any;
        isInteger(): boolean;
        isZero(): boolean;
        isRegular(): boolean;
        isNumber(): boolean;
        isInfinite(): boolean;
        isNaN(): boolean;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        ln(): Float;
        log2(): Float;
        log10(): Float;
        exp(): Float;
        exp2(): Float;
        exp10(): Float;
        /** Returns this number exponentiated to the given value. */
        pow(val: Float | number): Float;
        sin(): Float;
        cos(): Float;
        tan(): Float;
        sec(): Float;
        csc(): Float;
        cot(): Float;
        acos(): Float;
        asin(): Float;
        atan(): Float;
        sinh(): Float;
        cosh(): Float;
        tanh(): Float;
        sech(): Float;
        csch(): Float;
        coth(): Float;
        acosh(): Float;
        asinh(): Float;
        atanh(): Float;
        /** Calculate exponential integral */
        eint(): Float;
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2(): Float;
        /** Calculate the value of the Gamma function. */
        gamma(): Float;
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma(): Float;
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma(): Float;
        /** Calculate the value of the Beta function */
        beta(op2: Float): Float;
        /** Calculate the value of the Riemann Zeta function */
        zeta(): Float;
        /** Calculate the value of the error function */
        erf(): Float;
        /** Calculate the value of the complementary error function */
        erfc(): Float;
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0(): Float;
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1(): Float;
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n: number): Float;
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0(): Float;
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1(): Float;
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n: number): Float;
        /** Calculate the arithmetic-geometric mean */
        agm(op2: Float): Float;
        /** Calculate the value of the Airy function Ai on x */
        ai(): Float;
        sign(): number;
        toNumber(): number;
        /** Rounds to the next higher or equal representable integer */
        ceil(): Float;
        /** Rounds to the next lower or equal representable integer */
        floor(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven(): Float;
        /** Rounds to the next representable integer toward zero */
        trunc(): Float;
        /** Round to precision */
        roundTo(prec: number): Float;
        /** Returns the fractional part */
        frac(): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y: Float): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y: Float): Float;
        nextAbove(): Float;
        nextBelow(): Float;
        exponent2(): number;
        toString(): string;
        toFixed(digits?: number): any;
        toInteger(): Integer;
        toRational(): Rational;
    };
    Catalan: (options?: FloatOptions) => {
        mpfr_t: number;
        precisionBits: number;
        rndMode: number;
        type: string;
        readonly options: FloatOptions;
        readonly setOptions: FloatOptions;
        /** Returns the sum of this number and the given one. */
        add(val: AllTypes): Float;
        /** Returns the difference of this number and the given one. */
        sub(val: AllTypes): Float;
        /** Returns the product of this number and the given one. */
        mul(val: AllTypes): Float;
        /** Returns the result of the division of this number by the given one. */
        div(val: AllTypes): Float;
        /** Returns the integer square root number of this number. */
        sqrt(): Float;
        invSqrt(): Float;
        cbrt(): Float;
        nthRoot(nth: number): Float;
        /** Returns the number with inverted sign. */
        neg(): Float;
        /** Returns the absolute value of this number. */
        abs(): Float;
        factorial(): any;
        isInteger(): boolean;
        isZero(): boolean;
        isRegular(): boolean;
        isNumber(): boolean;
        isInfinite(): boolean;
        isNaN(): boolean;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        ln(): Float;
        log2(): Float;
        log10(): Float;
        exp(): Float;
        exp2(): Float;
        exp10(): Float;
        /** Returns this number exponentiated to the given value. */
        pow(val: Float | number): Float;
        sin(): Float;
        cos(): Float;
        tan(): Float;
        sec(): Float;
        csc(): Float;
        cot(): Float;
        acos(): Float;
        asin(): Float;
        atan(): Float;
        sinh(): Float;
        cosh(): Float;
        tanh(): Float;
        sech(): Float;
        csch(): Float;
        coth(): Float;
        acosh(): Float;
        asinh(): Float;
        atanh(): Float;
        /** Calculate exponential integral */
        eint(): Float;
        /** Calculate the real part of the dilogarithm (the integral of -log(1-t)/t from 0 to op) */
        li2(): Float;
        /** Calculate the value of the Gamma function. */
        gamma(): Float;
        /** Calculate the value of the logarithm of the absolute value of the Gamma function */
        lngamma(): Float;
        /** Calculate the value of the Digamma (sometimes also called Psi) function */
        digamma(): Float;
        /** Calculate the value of the Beta function */
        beta(op2: Float): Float;
        /** Calculate the value of the Riemann Zeta function */
        zeta(): Float;
        /** Calculate the value of the error function */
        erf(): Float;
        /** Calculate the value of the complementary error function */
        erfc(): Float;
        /** Calculate the value of the first kind Bessel function of order 0 */
        j0(): Float;
        /** Calculate the value of the first kind Bessel function of order 1 */
        j1(): Float;
        /** Calculate the value of the first kind Bessel function of order n */
        jn(n: number): Float;
        /** Calculate the value of the second kind Bessel function of order 0 */
        y0(): Float;
        /** Calculate the value of the second kind Bessel function of order 1 */
        y1(): Float;
        /** Calculate the value of the second kind Bessel function of order n */
        yn(n: number): Float;
        /** Calculate the arithmetic-geometric mean */
        agm(op2: Float): Float;
        /** Calculate the value of the Airy function Ai on x */
        ai(): Float;
        sign(): number;
        toNumber(): number;
        /** Rounds to the next higher or equal representable integer */
        ceil(): Float;
        /** Rounds to the next lower or equal representable integer */
        floor(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases away from zero */
        round(): Float;
        /** Rounds to the nearest representable integer, rounding halfway cases with the even-rounding rule */
        roundEven(): Float;
        /** Rounds to the next representable integer toward zero */
        trunc(): Float;
        /** Round to precision */
        roundTo(prec: number): Float;
        /** Returns the fractional part */
        frac(): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded toward zero */
        fmod(y: Float): Float;
        /** Calculate the value of x - ny, where n is the integer quotient of x divided by y; n is rounded to the nearest integer (ties rounded to even) */
        remainder(y: Float): Float;
        nextAbove(): Float;
        nextBelow(): Float;
        exponent2(): number;
        toString(): string;
        toFixed(digits?: number): any;
        toInteger(): Integer;
        toRational(): Rational;
    };
    destroy: () => void;
};
export {};
