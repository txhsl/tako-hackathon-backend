import mongoose from 'mongoose';
import sigUtil from 'eth-sig-util';
import ethUtil from 'ethereumjs-util';

// DB things
const url = 'mongodb://127.0.0.1:27017/tumpra';

const bindingSchema = mongoose.Schema({
    address: String,
    lensHandle: String,
    farcasterId: Number,
    friendtechAddr: String,
});

const Binding = mongoose.model('Binding', bindingSchema, 'bindings');

export const ConnectDB = async() => {
    await mongoose.connect(url);
};

export const AddBindings = async (address, type, id) => {
    var data = {};
    data[type] = id;

    await Binding.findOneAndUpdate(
        { address: address },
        data,
        { upsert: true }
    ).catch((err) => {
        console.log(err);
    });
};

export const CheckDuplication = async (type, id) => {
    var data = {};
    data[type] = id;

    var doc = await Binding.findOne(
        data,
    ).catch((err) => {
        console.log(err);
    });
    return doc != null;
}

export const GetBindings = async (address) => {
    var doc = await Binding.findOne(
        { address: address },
    ).catch((err) => {
        console.log(err);
    });
    return doc;
};

// Sig things
export const RecoverBindingSig = (address, type, id, sig) => {
    var data = {
        domain: 'Tumpra',
        address: address,
        type: type,
        id: id
    };
    return sigUtil.recoverPersonalSignature({
        data: ethUtil.bufferToHex(Buffer.from(JSON.stringify(data), 'utf8')),
        sig: sig        
    });
};

// var sig = sigUtil.personalSign(
//     Buffer.from('', 'hex'),
//     {
//         data: JSON.stringify({
//             domain: 'Tumpra',
//             address: '0x480dd671880768D24317FA965D00f43D25868892',
//             type: 'farcasterId',
//             id: 195739
//         })
//     }
// );

// console.log(sig);
