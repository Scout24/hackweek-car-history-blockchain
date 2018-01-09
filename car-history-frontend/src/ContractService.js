import Web3 from 'web3';
import contractABI from './smart-contracts/car-histroy.abi';
import contractBytecode from './smart-contracts/car-history.bytecode';

const defaultGasPrice = '300000000000';
const defaultGasVolume = '4000000';

export default class ContractService {

    constructor() {
        // change to https or ws provider after local node is created
        this.web3 = new Web3(Web3.givenProvider);

        // implement switch account logic
        this.web3.eth.getAccounts()
        .then((accounts) => {
          this.account = (accounts[0]);
        }).catch((e) => {
            console.log("Error in getting account");
        });
    }

    deployContract(data) {
        if (!this.account) {
            Promise.reject("No active account");
        }

        const contract = new this.web3.eth.Contract(contractABI,
            null, {
                gas: defaultGasVolume,
                gasPrice: defaultGasPrice,
                data: contractBytecode.object
            });
        return contract
            .deploy({arguments: [this.account, data.mileage, data.vin]})
            .send({from: this.account})
            .then((contract) => {
                console.log(contract);
                if (typeof contract.address !== 'undefined') {
                    console.log('Contract mined! address: ' + contract.address
                        + ' transactionHash: ' + contract.transactionHash);
                }
            })
    }

    getContractAtAddress(address) {
      return new this.web3.eth.Contract(contractABI, address)
    }

    readContractData(address) {
      const contract = this.getContractAtAddress(address);
      return Promise.all([
          contract.methods.VIN().call(),
          contract.methods.owner().call(),
          contract.methods.latestMileage().call(),
          this.getLogEntries(address)
        ])
        .then((data) => ({
          VIN: data[0],
          owner: data[1],
          latestMileage: data[2],
          logEntries: data[3]
        }));
    }

    async getLogEntries(address) {
      // TODO: reading from internal array instead of logs for now.
      // This is due to metamask not yet supporting logs/events via web3.js 1.0.
      // (see https://github.com/MetaMask/metamask-extension/issues/2350)
      const contract = this.getContractAtAddress(address);
      const numLogEntries = await contract.methods.getNumOfApprovedLogEntries().call();
      let logEntriesPromises = [];
      for(let i = 0; i < numLogEntries; i++) {
        logEntriesPromises.push(contract.methods.approvedLogEntries(i).call());
      }
      return Promise.all(logEntriesPromises);
    }

    getProposalData(address) {
      return this.getContractAtAddress(address).methods
        .latestProposedLogEntry().call()
    }

    proposeLogEntry(address, data) {
      return this.getContractAtAddress(address).methods
        .proposeLogEntry(data.mileage, data.comment)
        .send({from: this.account, gas: defaultGasVolume, gasPrice: defaultGasPrice})
        .then((event) => {
          console.log(event);
        });
    }

  approveProposedLogEntry(address) {
    return this.getContractAtAddress(address).methods
      .approveLogEntry()
      .send({from: this.account, gas: defaultGasVolume, gasPrice: defaultGasPrice})
      .then((event) => {
        console.log(event);
      });
  }
}

