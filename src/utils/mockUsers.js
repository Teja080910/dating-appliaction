const mockUsers = [
  // Indian Men (25)
  {
    id: '1',
    name: 'Arjun Sharma',
    gender: 'straight_man',
    distance: '12 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '2',
    name: 'Rohan Patel',
    gender: 'straight_man',
    distance: '5 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '3',
    name: 'Vikram Singh',
    gender: 'straight_man',
    distance: '18 km away',
    age: 26,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '4',
    name: 'Aarav Gupta',
    gender: 'straight_man',
    distance: '3 km away',
    age: 29,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '5',
    name: 'Aditya Joshi',
    gender: 'straight_man',
    distance: '22 km away',
    age: 33,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '6',
    name: 'Rahul Mehta',
    gender: 'straight_man',
    distance: '7 km away',
    age: 27,
    image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '7',
    name: 'Kunal Malhotra',
    gender: 'straight_man',
    distance: '15 km away',
    age: 30,
    image: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '8',
    name: 'Varun Reddy',
    gender: 'straight_man',
    distance: '9 km away',
    age: 25,
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '9',
    name: 'Siddharth Iyer',
    gender: 'straight_man',
    distance: '14 km away',
    age: 32,
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '10',
    name: 'Ankit Choudhary',
    gender: 'straight_man',
    distance: '6 km away',
    age: 28,
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '11',
    name: 'Rishi Kapoor',
    gender: 'straight_man',
    distance: '11 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '12',
    name: 'Dhruv Saxena',
    gender: 'straight_man',
    distance: '20 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '13',
    name: 'Nikhil Nair',
    gender: 'straight_man',
    distance: '4 km away',
    age: 26,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '14',
    name: 'Pranav Desai',
    gender: 'straight_man',
    distance: '17 km away',
    age: 34,
    image: 'https://images.pexels.com/photos/846741/pexels-photo-846741.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '15',
    name: 'Karan Oberoi',
    gender: 'straight_man',
    distance: '8 km away',
    age: 27,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '16',
    name: 'Yash Sinha',
    gender: 'straight_man',
    distance: '13 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '17',
    name: 'Amit Trivedi',
    gender: 'straight_man',
    distance: '19 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '18',
    name: 'Harsh Varma',
    gender: 'straight_man',
    distance: '2 km away',
    age: 25,
    image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '19',
    name: 'Rajat Khanna',
    gender: 'straight_man',
    distance: '10 km away',
    age: 32,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '20',
    name: 'Vivek Menon',
    gender: 'straight_man',
    distance: '16 km away',
    age: 28,
    image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '21',
    name: 'Abhishek Rao',
    gender: 'straight_man',
    distance: '21 km away',
    age: 31,
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '22',
    name: 'Surya Kumar',
    gender: 'straight_man',
    distance: '5 km away',
    age: 27,
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '23',
    name: 'Deepak Mishra',
    gender: 'straight_man',
    distance: '14 km away',
    age: 33,
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '24',
    name: 'Manish Agarwal',
    gender: 'straight_man',
    distance: '7 km away',
    age: 29,
    image: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '25',
    name: 'Gaurav Banerjee',
    gender: 'straight_man',
    distance: '18 km away',
    age: 30,
    image: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },

  // Foreign Men (25)
  {
    id: '26',
    name: 'Lucas Smith',
    gender: 'straight_man',
    distance: '22 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '27',
    name: 'James Johnson',
    gender: 'straight_man',
    distance: '9 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '28',
    name: 'Michael Brown',
    gender: 'straight_man',
    distance: '15 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '29',
    name: 'Daniel Miller',
    gender: 'straight_man',
    distance: '4 km away',
    age: 27,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '30',
    name: 'Ethan Davis',
    gender: 'straight_man',
    distance: '12 km away',
    age: 32,
    image: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '31',
    name: 'Matthew Wilson',
    gender: 'straight_man',
    distance: '7 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '32',
    name: 'Alexander Taylor',
    gender: 'straight_man',
    distance: '18 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '33',
    name: 'William Anderson',
    gender: 'straight_man',
    distance: '3 km away',
    age: 33,
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '34',
    name: 'Benjamin Thomas',
    gender: 'straight_man',
    distance: '11 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '35',
    name: 'Samuel Jackson',
    gender: 'straight_man',
    distance: '20 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '36',
    name: 'David White',
    gender: 'straight_man',
    distance: '6 km away',
    age: 26,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '37',
    name: 'Joseph Harris',
    gender: 'straight_man',
    distance: '14 km away',
    age: 34,
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '38',
    name: 'Christopher Martin',
    gender: 'straight_man',
    distance: '8 km away',
    age: 27,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '39',
    name: 'Andrew Thompson',
    gender: 'straight_man',
    distance: '16 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/846741/pexels-photo-846741.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '40',
    name: 'Joshua Garcia',
    gender: 'straight_man',
    distance: '2 km away',
    age: 25,
    image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '41',
    name: 'Ryan Martinez',
    gender: 'straight_man',
    distance: '10 km away',
    age: 32,
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '42',
    name: 'Nathan Robinson',
    gender: 'straight_man',
    distance: '19 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '43',
    name: 'Brandon Clark',
    gender: 'straight_man',
    distance: '5 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '44',
    name: 'Kevin Lewis',
    gender: 'straight_man',
    distance: '13 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '45',
    name: 'Justin Lee',
    gender: 'straight_man',
    distance: '21 km away',
    age: 33,
    image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '46',
    name: 'Robert Walker',
    gender: 'straight_man',
    distance: '7 km away',
    age: 27,
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '47',
    name: 'Tyler Hall',
    gender: 'straight_man',
    distance: '15 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '48',
    name: 'Jacob Young',
    gender: 'straight_man',
    distance: '4 km away',
    age: 26,
    image: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '49',
    name: 'Nicholas Allen',
    gender: 'straight_man',
    distance: '12 km away',
    age: 34,
    image: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '50',
    name: 'Jack King',
    gender: 'straight_man',
    distance: '9 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },

  // Indian Women (25)
  {
    id: '51',
    name: 'Priya Reddy',
    gender: 'straight_woman',
    distance: '11 km away',
    age: 27,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '52',
    name: 'Anjali Joshi',
    gender: 'straight_woman',
    distance: '6 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '53',
    name: 'Saanvi Kumar',
    gender: 'straight_woman',
    distance: '18 km away',
    age: 25,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '54',
    name: 'Neha Gupta',
    gender: 'straight_woman',
    distance: '3 km away',
    age: 32,
    image: 'https://images.pexels.com/photos/712521/pexels-photo-712521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '55',
    name: 'Meera Desai',
    gender: 'straight_woman',
    distance: '14 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '56',
    name: 'Divya Iyer',
    gender: 'straight_woman',
    distance: '7 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '57',
    name: 'Shreya Menon',
    gender: 'straight_woman',
    distance: '20 km away',
    age: 26,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '58',
    name: 'Pooja Sharma',
    gender: 'straight_woman',
    distance: '9 km away',
    age: 29,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '59',
    name: 'Riya Patel',
    gender: 'straight_woman',
    distance: '16 km away',
    age: 33,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '60',
    name: 'Ananya Singh',
    gender: 'straight_woman',
    distance: '2 km away',
    age: 24,
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '61',
    name: 'Isha Nair',
    gender: 'straight_woman',
    distance: '12 km away',
    age: 30,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '62',
    name: 'Tanvi Rao',
    gender: 'straight_woman',
    distance: '5 km away',
    age: 27,
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '63',
    name: 'Aditi Choudhary',
    gender: 'straight_woman',
    distance: '19 km away',
    age: 31,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '64',
    name: 'Kavya Kapoor',
    gender: 'straight_woman',
    distance: '8 km away',
    age: 28,
    image: 'https://images.pexels.com/photos/712521/pexels-photo-712521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '65',
    name: 'Maya Saxena',
    gender: 'straight_woman',
    distance: '15 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '66',
    name: 'Ishita Malhotra',
    gender: 'straight_woman',
    distance: '4 km away',
    age: 26,
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '67',
    name: 'Aarohi Trivedi',
    gender: 'straight_woman',
    distance: '13 km away',
    age: 32,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '68',
    name: 'Dia Varma',
    gender: 'straight_woman',
    distance: '10 km away',
    age: 25,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '69',
    name: 'Kiara Khanna',
    gender: 'straight_woman',
    distance: '17 km away',
    age: 30,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '70',
    name: 'Myra Oberoi',
    gender: 'straight_woman',
    distance: '6 km away',
    age: 28,
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '71',
    name: 'Zara Sinha',
    gender: 'straight_woman',
    distance: '21 km away',
    age: 31,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '72',
    name: 'Avni Agarwal',
    gender: 'straight_woman',
    distance: '9 km away',
    age: 27,
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '73',
    name: 'Ritika Banerjee',
    gender: 'straight_woman',
    distance: '14 km away',
    age: 33,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '74',
    name: 'Sia Mishra',
    gender: 'straight_woman',
    distance: '7 km away',
    age: 29,
    image: 'https://images.pexels.com/photos/712521/pexels-photo-712521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '75',
    name: 'Tara Deshmukh',
    gender: 'straight_woman',
    distance: '16 km away',
    age: 30,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },

  // Foreign Women (25)
  {
    id: '76',
    name: 'Emily Wilson',
    gender: 'straight_woman',
    distance: '12 km away',
    age: 28,
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '77',
    name: 'Sophia Brown',
    gender: 'straight_woman',
    distance: '5 km away',
    age: 31,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '78',
    name: 'Mia Williams',
    gender: 'straight_woman',
    distance: '18 km away',
    age: 26,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '79',
    name: 'Charlotte Taylor',
    gender: 'straight_woman',
    distance: '3 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '80',
    name: 'Harper White',
    gender: 'straight_woman',
    distance: '15 km away',
    age: 32,
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '81',
    name: 'Evelyn Harris',
    gender: 'straight_woman',
    distance: '8 km away',
    age: 27,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '82',
    name: 'Amelia Martin',
    gender: 'straight_woman',
    distance: '20 km away',
    age: 30,
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '83',
    name: 'Abigail Thompson',
    gender: 'straight_woman',
    distance: '4 km away',
    age: 25,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '84',
    name: 'Ella Garcia',
    gender: 'straight_woman',
    distance: '13 km away',
    age: 33,
    image: 'https://images.pexels.com/photos/712521/pexels-photo-712521.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '85',
    name: 'Scarlett Martinez',
    gender: 'straight_woman',
    distance: '9 km away',
    age: 28,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '86',
    name: 'Lily Robinson',
    gender: 'straight_woman',
    distance: '16 km away',
    age: 31,
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '87',
    name: 'Aria Clark',
    gender: 'straight_woman',
    distance: '7 km away',
    age: 29,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '88',
    name: 'Zoe Lewis',
    gender: 'straight_woman',
    distance: '14 km away',
    age: 26,
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
  },
  {
    id: '89',
    name: 'Stella Lee',
    gender: 'straight_woman',
    distance: '21 km away',   
    age: 30,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
]

export default mockUsers