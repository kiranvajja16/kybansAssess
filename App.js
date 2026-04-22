import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const App = () => {
  const [n, setN] = useState(8);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [bracket, setBracket] = useState([]);
  const [thirdPlace, setThirdPlace] = useState({left: null, right: null, winner: null});
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef([]).current;

  useEffect(() => {
    const t = generateTeams(n);
    setTeams(t);
    const numRounds = Math.log2(n);
    const br = [];
    for (let r = 0; r < numRounds; r++) {
      const numMatches = n / (2 ** (r + 1));
      br.push(Array(numMatches).fill().map(() => ({left: null, right: null, winner: null})));
    }
    setBracket(br);
    setSelectedTeams(new Set());
    setThirdPlace({left: null, right: null, winner: null});

    // Initialize slide animations
    slideAnims.length = 0;
    for (let i = 0; i < numRounds; i++) {
      slideAnims.push(new Animated.Value(-width));
    }

    // Animate rounds sliding in
    Animated.stagger(200, slideAnims.map(anim => 
      Animated.spring(anim, {
        toValue: 0,
        useNativeDriver: true,
      })
    )).start();
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  const generateTeams = (num) => {
    return Array(num).fill().map((_, i) => ({id: i, name: `Team ${i+1}`, logo: `🏆${i+1}`}));
  };

  const availableTeams = teams.filter(t => !selectedTeams.has(t.id));

  const handlePositionClick = (round, match, side) => {
    setDropdownPosition({round, match, side});
    setDropdownOptions(availableTeams);
    setShowDropdown(true);
  };

  const selectTeam = (teamId) => {
    if (dropdownPosition) {
      const {round, match, side} = dropdownPosition;
      const newBracket = [...bracket];
      newBracket[round][match][side] = teamId;
      setBracket(newBracket);
      setSelectedTeams(new Set([...selectedTeams, teamId]));
      setShowDropdown(false);
      setDropdownPosition(null);
    }
  };

  const deleteTeam = (round, match, side) => {
    const teamId = bracket[round][match][side];
    if (teamId !== null) {
      const newBracket = [...bracket];
      newBracket[round][match][side] = null;
      setBracket(newBracket);
      const newSet = new Set(selectedTeams);
      newSet.delete(teamId);
      setSelectedTeams(newSet);
      if (newBracket[round][match].winner === teamId) {
        newBracket[round][match].winner = null;
        setBracket(newBracket);
      }
    }
  };

  const handleMatchClick = (round, match) => {
    const m = bracket[round][match];
    if (m.left !== null && m.right !== null) {
      setDropdownPosition({round, match, type: 'winner'});
      setDropdownOptions([teams[m.left], teams[m.right]]);
      setShowDropdown(true);
    }
  };

  const selectWinner = (teamId) => {
    if (dropdownPosition.type === 'winner') {
      const {round, match} = dropdownPosition;
      const newBracket = [...bracket];
      newBracket[round][match].winner = teamId;
      setBracket(newBracket);
      if (round < bracket.length - 1) {
        const nextRound = round + 1;
        const nextMatch = Math.floor(match / 2);
        const nextSide = match % 2 === 0 ? 'left' : 'right';
        newBracket[nextRound][nextMatch][nextSide] = teamId;
        setBracket(newBracket);
      }
      if (round === bracket.length - 2) {
        const loser = teamId === newBracket[round][match].left ? newBracket[round][match].right : newBracket[round][match].left;
        const newThird = {...thirdPlace};
        if (match === 0) {
          newThird.left = loser;
        } else {
          newThird.right = loser;
        }
        setThirdPlace(newThird);
      }
      setShowDropdown(false);
      setDropdownPosition(null);
    } else if (dropdownPosition.type === 'third') {
      setThirdPlace({...thirdPlace, winner: teamId});
      setShowDropdown(false);
      setDropdownPosition(null);
    }
  };

  const handleThirdClick = () => {
    if (thirdPlace.left !== null && thirdPlace.right !== null) {
      setDropdownPosition({type: 'third'});
      setDropdownOptions([teams[thirdPlace.left], teams[thirdPlace.right]]);
      setShowDropdown(true);
    }
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#f0f8ff'}}>
      <View style={{padding: 20, alignItems: 'center'}}>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: '#2e8b57', marginBottom: 20}}>
          🏆 Tournament Bracket for {n} Teams 🏆
        </Text>
        {bracket.map((round, r) => (
          <Animated.View 
            key={r} 
            style={{
              flexDirection: 'row', 
              justifyContent: 'space-around', 
              marginVertical: 20,
              transform: [{ translateX: slideAnims[r] || 0 }]
            }}
          >
            {round.map((match, m) => (
              <View key={m} style={{alignItems: 'center', marginHorizontal: 10}}>
                <TouchableOpacity 
                  onPress={() => handlePositionClick(r, m, 'left')} 
                  onLongPress={() => deleteTeam(r, m, 'left')}
                  style={{
                    backgroundColor: match.left !== null ? '#4CAF50' : '#e0e0e0',
                    padding: 10,
                    borderRadius: 10,
                    minWidth: 120,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{color: match.left !== null ? 'white' : 'black', fontWeight: 'bold'}}>
                    {match.left !== null ? `${teams[match.left].logo} ${teams[match.left].name}` : 'Select Team'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMatchClick(r, m)} style={{marginVertical: 5}}>
                  <View style={{
                    width: 50, 
                    height: 3, 
                    backgroundColor: match.winner === match.left ? '#ff4444' : match.winner === match.right ? '#4CAF50' : '#333',
                    borderRadius: 2
                  }} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handlePositionClick(r, m, 'right')} 
                  onLongPress={() => deleteTeam(r, m, 'right')}
                  style={{
                    backgroundColor: match.right !== null ? '#4CAF50' : '#e0e0e0',
                    padding: 10,
                    borderRadius: 10,
                    minWidth: 120,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{color: match.right !== null ? 'white' : 'black', fontWeight: 'bold'}}>
                    {match.right !== null ? `${teams[match.right].logo} ${teams[match.right].name}` : 'Select Team'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        ))}
        <View style={{alignItems: 'center', marginVertical: 20}}>
          <TouchableOpacity 
            onPress={handleThirdClick}
            style={{
              backgroundColor: '#ff9800',
              padding: 15,
              borderRadius: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>🏅 Third Place Match</Text>
          </TouchableOpacity>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
            <Text style={{
              backgroundColor: thirdPlace.left !== null ? '#2196F3' : '#e0e0e0',
              padding: 10,
              borderRadius: 10,
              minWidth: 100,
              textAlign: 'center',
              color: thirdPlace.left !== null ? 'white' : 'black',
              fontWeight: 'bold'
            }}>
              {thirdPlace.left !== null ? teams[thirdPlace.left].name : 'Team'}
            </Text>
            <View style={{
              width: 50, 
              height: 3, 
              backgroundColor: thirdPlace.winner ? '#4CAF50' : '#333', 
              marginHorizontal: 10,
              borderRadius: 2
            }} />
            <Text style={{
              backgroundColor: thirdPlace.right !== null ? '#2196F3' : '#e0e0e0',
              padding: 10,
              borderRadius: 10,
              minWidth: 100,
              textAlign: 'center',
              color: thirdPlace.right !== null ? 'white' : 'black',
              fontWeight: 'bold'
            }}>
              {thirdPlace.right !== null ? teams[thirdPlace.right].name : 'Team'}
            </Text>
          </View>
          {thirdPlace.winner !== null && (
            <Animated.View style={{
              backgroundColor: '#ffd700',
              padding: 10,
              borderRadius: 10,
              marginTop: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
              transform: [{ scale: fadeAnim }]
            }}>
              <Text style={{color: '#333', fontWeight: 'bold', fontSize: 18}}>
                🥉 Winner: {teams[thirdPlace.winner].name}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
      <Modal visible={showDropdown} transparent animationType="none">
        <Animated.View style={{
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: fadeAnim
        }}>
          <Animated.View style={{
            backgroundColor: 'white', 
            padding: 20, 
            width: '80%', 
            maxHeight: '50%',
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            transform: [{ scale: fadeAnim }]
          }}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'}}>
              Select Winner
            </Text>
            <FlatList
              data={dropdownOptions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity 
                  onPress={() => selectWinner(item.id)} 
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 10,
                    marginVertical: 2
                  }}
                >
                  <Text style={{fontSize: 16}}>{item.logo} {item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              onPress={() => setShowDropdown(false)} 
              style={{
                padding: 15, 
                alignSelf: 'center',
                backgroundColor: '#f44336',
                borderRadius: 10,
                marginTop: 10
              }}
            >
              <Text style={{color: 'white', fontWeight: 'bold'}}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
};

export default App;
