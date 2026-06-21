export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = new.target.name;
    }
}

// NOTE: the following syntactical shorthand doesn't work in `strip-only` mode, since Node just erases type annotations without transforming any code
// `public statusCode: number` auto declares and assigns
// export class AppError extends Error {
//     constructor (message: string, public statusCode: number) {
//         super(message);
//         this.name = new.target.name;
//     }
// }

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}
