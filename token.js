import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

export const signKey = 'this_is_from_tumpra';

export const setToken = (address) => {
    return new Promise((resolve, reject) => {
        const token = sign({
            address: address,
        }, signKey, { expiresIn: '1h' });
        resolve(token);
    });
};

export const verToken = (token) => {
    return new Promise((resolve, reject) => {
        var info = verify(token.split(' ')[1], signKey);
        resolve(info);
    });
};