import Compound from '@compound-finance/compound-js';


//calculate the apy in the backend
//get on infura
const provider = 'https://mainnet.infura.io/v3/53b888932d594b0fa6ffb56fd3698f92';

const comptroller = Compound.util.getAddress(Compound.Comptroller);
//oracle smart contract which give the price in the compoud system
const opf = Compound.util.getAddress(Compound.PriceFeed);

const cTokenDecimals = 8;
//1 block per 15 seconds
const blocksPerDay = 4 * 60 * 24;
const daysPerYear = 365;
//scaling factor use by compound
//trick to do a decimals 
const ethMantissa = Math.pow(10, 18);

//
async function calculateSupplyApy(cToken) {
    //query the supply rate per block
    const supplyRatePerBlock = await Compound.eth.read(
        //address of the cToken
        cToken,
        'function supplyRatePerBlock() returns(uint)',
        [],
        //pass the provider to know how to conect the blockchain
        { provider }
    );
    //compound the supply rate of each block of the year to get an annualized rate
    //the scalable per block is 10 * 18, we need to divide by the same amount to get a real figure
    //compound by days per year -1 because a year period of the period in the year is one less than a number of days
    //- 1 to keep the decimal part * 100 to get a percentage
    return 100 * (Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear - 1) - 1);
} 