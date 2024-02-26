import mongoose from 'mongoose';
import sigUtil from 'eth-sig-util';
import ethUtil from 'ethereumjs-util';

// DB things
const url = 'mongodb://127.0.0.1:27017/tumpra';

export const LensBindMsg = 'http://localhost wants you to sign in with your profile:\n{id}\n\nSign in with Lens to Tempura\n\nURI: http://localhost\nVersion: 1\nChain ID: 80001';
export const FcBindMsg = 'http://localhost wants you to sign in with your id:\n{id}\n\nSign in with Farcaster to Tempura\n\nURI: http://localhost\nVersion: 1\nChain ID: 80001';
export const FtBindMsg = 'http://localhost wants you to sign in with your wallet:\n{id}\n\nSign in with Friend Tech to Tempura\n\nURI: http://localhost\nVersion: 1\nChain ID: 80001';

const bindingSchema = mongoose.Schema({
    address: String,
    lensId: String,
    farcasterId: Number,
    friendtechAddr: String,
    display: String
});

const Binding = mongoose.model('Binding', bindingSchema, 'bindings');

export const ConnectDB = async () => {
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

export const ChangeDisplay = async (address, display) => {
    await Binding.findOneAndUpdate(
        { address: address },
        { 'display': display },
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
export const RecoverPersonalSig = (msg, sig) => {
    try {
        return sigUtil.recoverPersonalSignature({
            data: ethUtil.bufferToHex(Buffer.from(msg, 'utf8')),
            sig: sig
        });
    } catch (err) {
        return null;
    }
};

// var sig = sigUtil.personalSign(
//     Buffer.from('', 'hex'),
//     {
//         data: ''
//     }
// );

// console.log(sig);
