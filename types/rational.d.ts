import type { GMPFunctions } from './functions';
import { Float } from './float';
import { Integer } from './integer';
declare type RationalFactoryReturn = ReturnType<typeof getRationalContext>['Rational'];
export interface RationalFactory extends RationalFactoryReturn {
}
declare type RationalReturn = ReturnType<RationalFactoryReturn>;
export interface Rational extends RationalReturn {
}
declare type AllTypes = Integer | Rational | Float | string | number;
declare type OutputType<T> = T extends number ? Rational : T extends Integer ? Rational : T extends Rational ? Rational : T extends Float ? Float : never;
export declare function getRationalContext(gmp: GMPFunctions, ctx: any): {
    Rational: (p1: string | number | Rational | Integer, p2?: string | number | Integer) => {
        mpq_t: number;
        type: string;
        /** Returns the sum of this number and the given one. */
        add<T extends AllTypes>(val: T): OutputType<T>;
        /** Returns the difference of this number and the given one. */
        sub<T_1 extends AllTypes>(val: T_1): OutputType<T_1>;
        /** Returns the product of this number and the given one. */
        mul<T_2 extends AllTypes>(val: T_2): OutputType<T_2>;
        /** Returns the number with inverted sign. */
        neg(): Rational;
        invert(): Rational;
        /** Returns the absolute value of this number. */
        abs(): Rational;
        /** Returns the result of the division of this number by the given one. */
        div<T_3 extends AllTypes>(val: T_3): OutputType<T_3>;
        isEqual(val: AllTypes): boolean;
        lessThan(val: AllTypes): boolean;
        lessOrEqual(val: AllTypes): boolean;
        greaterThan(val: AllTypes): boolean;
        greaterOrEqual(val: AllTypes): boolean;
        numerator(): Integer;
        denominator(): Integer;
        sign(): number;
        toNumber(): number;
        toString(): string;
        toInteger(): Integer;
        toFloat(): Float;
    };
    isRational: (val: any) => boolean;
    destroy: () => void;
};
export {};
