import mongoose from 'mongoose';

// DB things
const url = 'mongodb://127.0.0.1:27017/tumpra';

const bindingSchema = mongoose.Schema({
    address: String,
    lensId: String,
    farcasterId: Number,
    friendtechAddr: String,
    display: String
});

const vaultSchema = mongoose.Schema({
    borrower: String,
    expectedAmount: Number,
    receivedAmount: Number,
    createdTime: Number,
    startTime: Number,
    borrowTime: Number,
    repayTime: Number,
    endTime: Number,
    feeRate: Number,
});

const stakeHistorySchema = mongoose.Schema({
    staker: String,
    to: String,
    amount: Number,
    lastStakeTime: Number,
    withdrawTime: Number,
});

export const Binding = mongoose.model('Binding', bindingSchema, 'bindings');

export const Vault = mongoose.model('Vault', vaultSchema, 'vaults');

export const StakeHistory = mongoose.model('StakeHistory', stakeHistorySchema, 'stake-historys');

export const ConnectDB = async () => {
    await mongoose.connect(url);
};