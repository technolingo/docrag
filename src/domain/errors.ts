// `public statusCode: number` auto declares and assigns
class AppError extends Error {
    constructor (message: string, public statusCode: number) {
        super(message);
        this.name = new.target.name;
    }
}

// class AppError extends Error {
//     statusCode: number;
//     constructor (message: string, statusCode: number) {
//         super(message);
//         this.statusCode = statusCode;
//         this.name = new.target.name;
//     }
// }

class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}
