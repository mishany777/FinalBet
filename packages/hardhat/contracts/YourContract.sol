// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract BettingManager {
    struct Bet {
        address better;
        uint256 amount;
        bool outcome; // true for win, false for lose
    }

    struct Match {
        string title;
        uint256 startTimestamp;
        uint256 endTimestamp;
        mapping(address => Bet) bets;
        bool isActive;
        bool outcome; // true if the match was won, false if lost
    }

    address public administrator;
    uint256 public totalMatches = 0;
    mapping(uint256 => Match) public matches;

    modifier onlyAdministrator() {
        require(msg.sender == administrator, "Caller is not the administrator");
        _;
    }

    modifier matchExists(uint256 matchId) {
        require(matches[matchId].isActive, "Match does not exist");
        _;
    }

    modifier duringMatch(uint256 matchId) {
        require(
            block.timestamp >= matches[matchId].startTimestamp &&
            block.timestamp <= matches[matchId].endTimestamp,
            "Match is not currently active"
        );
        _;
    }

    modifier hasNotBetOnMatch(uint256 matchId) {
        require(matches[matchId].bets[msg.sender].amount == 0, "You have already placed a bet");
        _;
    }

    constructor() {
        administrator = msg.sender;
    }

    event MatchCreated(uint256 indexed matchId, string title, uint256 startTimestamp, uint256 endTimestamp);
    event BetPlaced(uint256 indexed matchId, address indexed better, uint256 amount, bool outcome);
    event MatchResultDeclared(uint256 indexed matchId, bool outcome);

    function getAdministrator() public view returns (address) {
        return administrator;
    }

    function changeAdministrator(address newAdmin) public onlyAdministrator {
        require(newAdmin != address(0), "New administrator is the zero address");
        administrator = newAdmin;
    }

    function createMatch(
        string memory _title,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) public onlyAdministrator {
        require(_startTimestamp < _endTimestamp, "Invalid time range");

        Match storage newMatch = matches[totalMatches];
        newMatch.title = _title;
        newMatch.startTimestamp = _startTimestamp;
        newMatch.endTimestamp = _endTimestamp;
        newMatch.isActive = true;

        emit MatchCreated(totalMatches, _title, _startTimestamp, _endTimestamp);
        totalMatches++;
    }

    function placeBet(uint256 matchId, bool outcome)
        public
        payable
        matchExists(matchId)
        duringMatch(matchId)
        hasNotBetOnMatch(matchId)
    {
        require(msg.value > 0, "Bet amount must be greater than zero");

        Match storage currentMatch = matches[matchId];
        currentMatch.bets[msg.sender] = Bet({better: msg.sender, amount: msg.value, outcome: outcome});

        emit BetPlaced(matchId, msg.sender, msg.value, outcome);
    }

    function declareMatchResult(uint256 matchId, bool outcome) public onlyAdministrator matchExists(matchId) {
        Match storage currentMatch = matches[matchId];
        require(currentMatch.isActive, "Match is already concluded");

        currentMatch.outcome = outcome;
        currentMatch.isActive = false;

        emit MatchResultDeclared(matchId, outcome);
    }

    function getBetDetails(uint256 matchId) public view matchExists(matchId) returns (address, uint256, bool) {
        Bet storage userBet = matches[matchId].bets[msg.sender];
        return (userBet.better, userBet.amount, userBet.outcome);
    }
}