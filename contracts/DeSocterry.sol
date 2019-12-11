pragma solidity ^0.4.24;

import "https://github.com/smartcontractkit/chainlink/evm/contracts/ChainlinkClient.sol";

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() public {
        owner = msg.sender;
    }
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0)
            return 0;
        uint256 c = a * b;
        require(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;
        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);
        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

contract ERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) internal _balances;
    mapping (address => mapping (address => uint256)) internal _allowed;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    uint256 internal _totalSupply;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        _transfer(from, to, value);
        _allowed[msg.sender][to] = _allowed[msg.sender][to].sub(value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0));
        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }
}

contract ERC20Mintable is ERC20, Ownable {
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
        emit Burn(from, amount);
    }

    function _mint(address to, uint256 amount) internal {
        _balances[to] = _balances[to].add(amount);
        _totalSupply = _totalSupply.add(amount);
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        _balances[from] = _balances[from].sub(amount);
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(from, address(0), amount);
    }
}

contract Ticket is ERC20Mintable {}

contract Game is ChainlinkClient, Ownable {
    using SafeMath for uint256;

    uint256 private oraclePaymentAmount;
    bytes32 private jobId;
    
    uint256 public matchId;
    uint256 public betStartTime;
    uint256 public betEndTime;
    bool public isFinal;
    string public winner;
    
    ERC20 Dai = ERC20(0xb029284433D23B3318C4DC4eF3E04976AEf899cC);
    Ticket public HomeTeamIsWinner;
    Ticket public AwayTeamIsWinner;
    Ticket public NoOneIsWinner;
    
    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _oraclePaymentAmount
    ) public {
        if (_link == address(0)) {
          setPublicChainlinkToken();
        } else {
          setChainlinkToken(_link);
        }
        
        setChainlinkOracle(_oracle);
        jobId = _jobId;
        oraclePaymentAmount = _oraclePaymentAmount;
    }
    
    function start(uint256 _matchId, uint256 _betStartTime, uint256 _betEndTime) external onlyOwner {
        matchId = _matchId;
        betStartTime = _betStartTime;
        betEndTime = _betEndTime;
        HomeTeamIsWinner = new Ticket();
        AwayTeamIsWinner = new Ticket();
        NoOneIsWinner = new Ticket();
    }
    
    function betOnHomeTeam(uint256 _amount) external {
        require(now > betStartTime && now < betEndTime);
        Dai.transferFrom(msg.sender, address(this), _amount);
        HomeTeamIsWinner.mint(msg.sender, _amount);
    }
    
    function betOnAwayTeam(uint256 _amount) external {
        require(now > betStartTime && now < betEndTime);
        Dai.transferFrom(msg.sender, address(this), _amount);
        AwayTeamIsWinner.mint(msg.sender, _amount);
    }
    
    function betOnTie(uint256 _amount) external {
        require(now > betStartTime && now < betEndTime);
        Dai.transferFrom(msg.sender, address(this), _amount);
        NoOneIsWinner.mint(msg.sender, _amount);
    }
    
    function draw() external returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, this, this.fulfill.selector);
        req.addUint("matchId", matchId);
        req.add("copyPath", "outcome.winner");
        requestId = sendChainlinkRequestTo(chainlinkOracleAddress(), req, oraclePaymentAmount);
    }
    
    function win() external returns (uint256 returnAmount) {
        require(isFinal);
        
        uint256 totalStakes = Dai.balanceOf(address(this));

        if (keccak256(abi.encodePacked(winner)) == keccak256(abi.encodePacked('home'))) {
            uint256 homeAmount = HomeTeamIsWinner.balanceOf(msg.sender);
            uint256 homeTotalSupply = HomeTeamIsWinner.totalSupply();

            returnAmount = totalStakes * homeAmount / homeTotalSupply;
            Dai.transfer(msg.sender, returnAmount);
            HomeTeamIsWinner.burn(msg.sender, homeAmount);
        } else if (keccak256(abi.encodePacked(winner)) == keccak256(abi.encodePacked('away'))) {
            uint256 awayAmount = AwayTeamIsWinner.balanceOf(msg.sender);
            uint256 awayTotalSupply = AwayTeamIsWinner.totalSupply();
            
            returnAmount = totalStakes * awayAmount / awayTotalSupply;
            Dai.transfer(msg.sender, returnAmount);
            AwayTeamIsWinner.burn(msg.sender, awayAmount);
        } else if (keccak256(abi.encodePacked(winner)) == keccak256(abi.encodePacked('tie'))) {
            uint256 tieAmount = NoOneIsWinner.balanceOf(msg.sender);
            uint256 tieTotalSupply = NoOneIsWinner.totalSupply();

            returnAmount = totalStakes * tieAmount / tieTotalSupply;
            Dai.transfer(msg.sender, returnAmount);
            NoOneIsWinner.burn(msg.sender, tieAmount);
        }
    }
    
    function fulfill(bytes32 _requestId, bytes32 _result) public recordChainlinkFulfillment(_requestId) {
        if (_result.length > 0) {
            winner = byte32ToString(_result);
            isFinal =  true;
        }
    }
    
    function byte32ToString(bytes32 b) internal pure returns (string) {
       
       bytes memory names = new bytes(b.length);
       
       for(uint i = 0; i < b.length; i++) {
           
           names[i] = b[i];
       }
       
       return string(names);
   }
}
