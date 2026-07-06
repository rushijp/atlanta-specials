import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';
import { Button } from '../components/ui';

// ─── 300 Realistic Indian Wedding Guest Dataset ─────────────────────────────
// Covers: varying family sizes (2-8), all ages, both sides, multiple cities,
// dietary diversity, VIP/elderly/kids tags, plus-ones, hotel needs, languages

function generateGuests() {
  const guests = [];
  let familyCounter = 0;

  const familyId = () => `fam_${++familyCounter}`;

  // Helper to create a guest
  const g = (firstName, lastName, opts = {}) => ({
    firstName,
    lastName,
    email: opts.email || '',
    phone: opts.phone || '',
    familyId: opts.familyId || null,
    familyName: opts.familyName || '',
    side: opts.side || 'bride',
    relation: opts.relation || '',
    dietary: opts.dietary || 'vegetarian',
    dietaryNotes: opts.dietaryNotes || '',
    tableNumber: null,
    seatIndex: null,
    rsvpStatus: opts.rsvpStatus || {},
    rsvpMethod: opts.rsvpMethod || 'manual',
    plusOne: opts.plusOne || false,
    plusOneName: opts.plusOneName || '',
    needsHotel: opts.needsHotel || false,
    hotelNotes: opts.hotelNotes || '',
    travelFrom: opts.travelFrom || '',
    arrivalDate: opts.arrivalDate || null,
    departureDate: opts.departureDate || null,
    language: opts.language || 'en',
    notes: opts.notes || '',
    tags: opts.tags || [],
    importedFrom: 'manual',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BRIDE'S SIDE — ~150 guests
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Bride's Immediate Family (8 people) ---
  const fam1 = familyId();
  guests.push(
    g('Rajesh', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Father of Bride', tags: ['VIP', 'immediate-family'], travelFrom: 'Atlanta, GA', phone: '770-555-0101', email: 'rajesh.shah@gmail.com', language: 'gu' }),
    g('Meena', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Mother of Bride', tags: ['VIP', 'immediate-family'], travelFrom: 'Atlanta, GA', phone: '770-555-0102', dietary: 'jain', language: 'gu' }),
    g('Priya', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Bride', tags: ['VIP', 'immediate-family'], travelFrom: 'Atlanta, GA', email: 'priya.shah@gmail.com' }),
    g('Karan', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Brother of Bride', tags: ['immediate-family'], travelFrom: 'New York, NY', email: 'karan.shah@outlook.com', plusOne: true, plusOneName: 'Jessica Miller' }),
    g('Nani', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Grandmother (Paternal)', tags: ['VIP', 'elderly'], dietary: 'jain', language: 'gu', notes: 'Wheelchair accessible seating needed', needsHotel: true }),
    g('Dada', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Grandfather (Paternal)', tags: ['VIP', 'elderly'], dietary: 'jain', language: 'gu', needsHotel: true }),
    g('Kavita', 'Shah', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Sister of Bride', tags: ['immediate-family'], travelFrom: 'Atlanta, GA' }),
    g('Anita', 'Mehta', { familyId: fam1, familyName: 'The Shah Family (Bride)', side: 'bride', relation: 'Maternal Grandmother', tags: ['VIP', 'elderly'], dietary: 'vegetarian', language: 'hi', needsHotel: true, travelFrom: 'Mumbai, India' }),
  );

  // --- Bride's Maternal Uncle Family (6 people) ---
  const fam2 = familyId();
  guests.push(
    g('Suresh', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Maternal Uncle (Mama)', tags: ['VIP'], travelFrom: 'Mumbai, India', needsHotel: true, phone: '+91-98765-43210', language: 'hi' }),
    g('Usha', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Maternal Aunt (Mami)', travelFrom: 'Mumbai, India', needsHotel: true, dietary: 'jain', language: 'hi' }),
    g('Rohan', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Cousin', travelFrom: 'Mumbai, India', needsHotel: true, email: 'rohan.mehta@yahoo.com', dietary: 'non-veg' }),
    g('Sneha', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Cousin', travelFrom: 'Mumbai, India', needsHotel: true, tags: ['kids'] }),
    g('Arjun', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Cousin', travelFrom: 'Mumbai, India', needsHotel: true, tags: ['kids'], notes: 'Age 8, needs kids meal' }),
    g('Baby', 'Mehta', { familyId: fam2, familyName: 'The Mehta Family', side: 'bride', relation: 'Cousin (Infant)', travelFrom: 'Mumbai, India', needsHotel: true, tags: ['kids'], notes: 'Age 2, high chair needed' }),
  );

  // --- Bride's Paternal Uncle Family 1 (5 people) ---
  const fam3 = familyId();
  guests.push(
    g('Bharat', 'Shah', { familyId: fam3, familyName: 'Bharat Shah Family', side: 'bride', relation: 'Paternal Uncle (Kaka)', tags: ['VIP'], travelFrom: 'Edison, NJ', needsHotel: true, phone: '732-555-0201' }),
    g('Hema', 'Shah', { familyId: fam3, familyName: 'Bharat Shah Family', side: 'bride', relation: 'Paternal Aunt (Kaki)', travelFrom: 'Edison, NJ', needsHotel: true, dietary: 'vegetarian' }),
    g('Nikhil', 'Shah', { familyId: fam3, familyName: 'Bharat Shah Family', side: 'bride', relation: 'Cousin', travelFrom: 'Edison, NJ', needsHotel: true, email: 'nikhil.s@gmail.com', plusOne: true, plusOneName: 'Tanya Kapoor' }),
    g('Pooja', 'Shah', { familyId: fam3, familyName: 'Bharat Shah Family', side: 'bride', relation: 'Cousin', travelFrom: 'Boston, MA', needsHotel: true }),
    g('Rishi', 'Shah', { familyId: fam3, familyName: 'Bharat Shah Family', side: 'bride', relation: 'Cousin', travelFrom: 'Edison, NJ', tags: ['kids'], notes: 'Age 14, teenager' }),
  );

  // --- Bride's Paternal Uncle Family 2 (4 people, from India) ---
  const fam4 = familyId();
  guests.push(
    g('Mahesh', 'Shah', { familyId: fam4, familyName: 'Mahesh Shah Family', side: 'bride', relation: 'Paternal Uncle (Kaka)', travelFrom: 'Ahmedabad, India', needsHotel: true, language: 'gu', dietary: 'jain' }),
    g('Rina', 'Shah', { familyId: fam4, familyName: 'Mahesh Shah Family', side: 'bride', relation: 'Paternal Aunt (Kaki)', travelFrom: 'Ahmedabad, India', needsHotel: true, language: 'gu', dietary: 'jain' }),
    g('Dhruv', 'Shah', { familyId: fam4, familyName: 'Mahesh Shah Family', side: 'bride', relation: 'Cousin', travelFrom: 'Ahmedabad, India', needsHotel: true, email: 'dhruv.shah@hotmail.com' }),
    g('Mira', 'Shah', { familyId: fam4, familyName: 'Mahesh Shah Family', side: 'bride', relation: 'Cousin', travelFrom: 'Ahmedabad, India', needsHotel: true }),
  );

  // --- Bride's Maternal Aunt Family (5 people) ---
  const fam5 = familyId();
  guests.push(
    g('Jayesh', 'Desai', { familyId: fam5, familyName: 'The Desai Family', side: 'bride', relation: 'Maternal Uncle (Mausa)', travelFrom: 'Chicago, IL', needsHotel: true }),
    g('Nisha', 'Desai', { familyId: fam5, familyName: 'The Desai Family', side: 'bride', relation: 'Maternal Aunt (Mausi)', travelFrom: 'Chicago, IL', needsHotel: true, dietary: 'vegetarian' }),
    g('Aditya', 'Desai', { familyId: fam5, familyName: 'The Desai Family', side: 'bride', relation: 'Cousin', travelFrom: 'Chicago, IL', needsHotel: true, email: 'adi.desai@gmail.com', dietary: 'non-veg' }),
    g('Ishani', 'Desai', { familyId: fam5, familyName: 'The Desai Family', side: 'bride', relation: 'Cousin', travelFrom: 'Chicago, IL', needsHotel: true }),
    g('Vivaan', 'Desai', { familyId: fam5, familyName: 'The Desai Family', side: 'bride', relation: 'Cousin', travelFrom: 'Chicago, IL', needsHotel: true, tags: ['kids'], notes: 'Age 5' }),
  );

  // --- Bride's Family Friends - The Joshi Family (3 people) ---
  const fam6 = familyId();
  guests.push(
    g('Prakash', 'Joshi', { familyId: fam6, familyName: 'The Joshi Family', side: 'bride', relation: 'Family Friend', travelFrom: 'Atlanta, GA', phone: '404-555-0301' }),
    g('Sarla', 'Joshi', { familyId: fam6, familyName: 'The Joshi Family', side: 'bride', relation: 'Family Friend', travelFrom: 'Atlanta, GA', tags: ['elderly'] }),
    g('Amit', 'Joshi', { familyId: fam6, familyName: 'The Joshi Family', side: 'bride', relation: 'Family Friend', travelFrom: 'Atlanta, GA', email: 'amit.joshi@corp.com' }),
  );

  // --- Bride's College Friends (individual, no family) ---
  guests.push(
    g('Tanvi', 'Kapoor', { side: 'bride', relation: 'College Friend', travelFrom: 'San Francisco, CA', needsHotel: true, email: 'tanvi.k@gmail.com', dietary: 'vegan', plusOne: true, plusOneName: 'Marcus Chen' }),
    g('Aisha', 'Khan', { side: 'bride', relation: 'College Friend', travelFrom: 'Austin, TX', needsHotel: true, email: 'aisha.khan@outlook.com', dietary: 'non-veg' }),
    g('Deepa', 'Reddy', { side: 'bride', relation: 'College Friend', travelFrom: 'Atlanta, GA', email: 'deepa.r@gmail.com' }),
    g('Sonia', 'Gupta', { side: 'bride', relation: 'College Friend', travelFrom: 'Dallas, TX', needsHotel: true, email: 'sonia.gupta@yahoo.com', plusOne: true, plusOneName: 'James Wilson' }),
    g('Rachel', 'Green', { side: 'bride', relation: 'College Friend', travelFrom: 'Atlanta, GA', email: 'rachel.green@gmail.com', dietary: 'non-veg', notes: 'Non-Indian guest, provide English menu' }),
    g('Sarah', 'Johnson', { side: 'bride', relation: 'College Friend', travelFrom: 'Charlotte, NC', needsHotel: true, email: 'sarah.j@gmail.com', dietary: 'non-veg' }),
    g('Monica', 'Patel', { side: 'bride', relation: 'College Friend (Roommate)', travelFrom: 'Atlanta, GA', email: 'monica.p@gmail.com' }),
    g('Neha', 'Agarwal', { side: 'bride', relation: 'College Friend', travelFrom: 'Seattle, WA', needsHotel: true, email: 'neha.a@tech.com', dietary: 'vegetarian' }),
  );

  // --- Bride's Work Friends ---
  guests.push(
    g('Jennifer', 'Liu', { side: 'bride', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'jen.liu@company.com', dietary: 'non-veg' }),
    g('David', 'Kim', { side: 'bride', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'david.kim@company.com', dietary: 'non-veg', plusOne: true, plusOneName: 'Emily Kim' }),
    g('Shreya', 'Iyer', { side: 'bride', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'shreya.iyer@corp.com' }),
    g('Michael', 'Thompson', { side: 'bride', relation: 'Boss (Bride)', travelFrom: 'Atlanta, GA', email: 'm.thompson@company.com', dietary: 'non-veg', tags: ['VIP'], plusOne: true, plusOneName: 'Linda Thompson' }),
    g('Priyanka', 'Nair', { side: 'bride', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'priyanka.nair@corp.com' }),
  );

  // --- Bride's Extended - Masi Family (7 people, large family from India) ---
  const fam7 = familyId();
  guests.push(
    g('Ramesh', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Mausa (2nd Masi husband)', travelFrom: 'Surat, India', needsHotel: true, language: 'gu' }),
    g('Varsha', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Masi (2nd)', travelFrom: 'Surat, India', needsHotel: true, language: 'gu', dietary: 'jain' }),
    g('Harsh', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true }),
    g('Krupa', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true }),
    g('Yash', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true, tags: ['kids'], notes: 'Age 12' }),
    g('Riya', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true, tags: ['kids'], notes: 'Age 9' }),
    g('Aarav', 'Trivedi', { familyId: fam7, familyName: 'The Trivedi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true, tags: ['kids'], notes: 'Age 4' }),
  );

  // --- Bride's Parents' Community Friends (couples) ---
  const fam8 = familyId();
  guests.push(
    g('Vinod', 'Bhatt', { familyId: fam8, familyName: 'The Bhatt Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Atlanta, GA', tags: ['elderly'] }),
    g('Pushpa', 'Bhatt', { familyId: fam8, familyName: 'The Bhatt Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Atlanta, GA', tags: ['elderly'], dietary: 'jain' }),
  );

  const fam9 = familyId();
  guests.push(
    g('Haresh', 'Thakkar', { familyId: fam9, familyName: 'The Thakkar Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Atlanta, GA' }),
    g('Jyoti', 'Thakkar', { familyId: fam9, familyName: 'The Thakkar Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Atlanta, GA' }),
    g('Raj', 'Thakkar', { familyId: fam9, familyName: 'The Thakkar Family', side: 'bride', relation: 'Community Friend (Son)', travelFrom: 'Atlanta, GA', email: 'raj.thakkar@gmail.com' }),
  );

  const fam10 = familyId();
  guests.push(
    g('Dilip', 'Amin', { familyId: fam10, familyName: 'The Amin Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Alpharetta, GA', tags: ['elderly'] }),
    g('Kamla', 'Amin', { familyId: fam10, familyName: 'The Amin Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Alpharetta, GA', tags: ['elderly'], notes: 'Diabetic - sugar-free desserts' }),
  );

  const fam11 = familyId();
  guests.push(
    g('Naresh', 'Modi', { familyId: fam11, familyName: 'The Modi Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Duluth, GA' }),
    g('Rekha', 'Modi', { familyId: fam11, familyName: 'The Modi Family', side: 'bride', relation: 'Community Friend', travelFrom: 'Duluth, GA' }),
    g('Vishal', 'Modi', { familyId: fam11, familyName: 'The Modi Family', side: 'bride', relation: 'Community Friend (Son)', travelFrom: 'Duluth, GA', plusOne: true, plusOneName: 'Kristi Modi' }),
  );

  // --- Bride's Distant Relatives - Fuva/Fui Family (4 people) ---
  const fam12 = familyId();
  guests.push(
    g('Kishor', 'Pandya', { familyId: fam12, familyName: 'The Pandya Family', side: 'bride', relation: 'Fuva (Dad\'s Sister\'s Husband)', travelFrom: 'London, UK', needsHotel: true, tags: ['VIP'], language: 'gu' }),
    g('Meera', 'Pandya', { familyId: fam12, familyName: 'The Pandya Family', side: 'bride', relation: 'Fui (Dad\'s Sister)', travelFrom: 'London, UK', needsHotel: true, tags: ['VIP'], language: 'gu' }),
    g('Neil', 'Pandya', { familyId: fam12, familyName: 'The Pandya Family', side: 'bride', relation: 'Cousin', travelFrom: 'London, UK', needsHotel: true, email: 'neil.pandya@gmail.co.uk' }),
    g('Ananya', 'Pandya', { familyId: fam12, familyName: 'The Pandya Family', side: 'bride', relation: 'Cousin', travelFrom: 'London, UK', needsHotel: true }),
  );

  // --- Bride's Temple/Religious community (3 couples) ---
  const fam13 = familyId();
  guests.push(
    g('Pandit', 'Shastri', { familyId: fam13, familyName: 'Pandit Shastri', side: 'bride', relation: 'Family Priest', travelFrom: 'Atlanta, GA', tags: ['VIP'], dietary: 'vegetarian', language: 'hi', notes: 'Performing ceremony' }),
    g('Shanti', 'Shastri', { familyId: fam13, familyName: 'Pandit Shastri', side: 'bride', relation: 'Priest\'s Wife', travelFrom: 'Atlanta, GA', dietary: 'vegetarian', language: 'hi' }),
  );

  guests.push(
    g('Chandrakant', 'Vyas', { side: 'bride', relation: 'Temple Committee', travelFrom: 'Lawrenceville, GA', tags: ['elderly'], language: 'gu' }),
    g('Induben', 'Vyas', { side: 'bride', relation: 'Temple Committee', travelFrom: 'Lawrenceville, GA', tags: ['elderly'], language: 'gu', dietary: 'jain' }),
  );

  // --- Bride's Neighborhood Aunties (attend everything, solo or with husband) ---
  guests.push(
    g('Sunita', 'Sharma', { side: 'bride', relation: 'Neighborhood Aunty', travelFrom: 'Atlanta, GA', language: 'hi' }),
    g('Geeta', 'Verma', { side: 'bride', relation: 'Neighborhood Aunty', travelFrom: 'Atlanta, GA', language: 'hi', plusOne: true, plusOneName: 'Ravi Verma' }),
    g('Lata', 'Mishra', { side: 'bride', relation: 'Neighborhood Aunty', travelFrom: 'Atlanta, GA' }),
  );

  // --- Bride's Childhood Friends (3 individuals) ---
  guests.push(
    g('Ritu', 'Parikh', { side: 'bride', relation: 'Childhood Friend', travelFrom: 'Atlanta, GA', email: 'ritu.p@gmail.com' }),
    g('Komal', 'Dave', { side: 'bride', relation: 'Childhood Friend', travelFrom: 'Nashville, TN', needsHotel: true, email: 'komal.dave@yahoo.com', plusOne: true, plusOneName: 'Tom Davis' }),
    g('Payal', 'Patel', { side: 'bride', relation: 'Childhood Friend', travelFrom: 'Atlanta, GA', email: 'payal.patel@hotmail.com' }),
  );

  // --- Bride's Dad's Business Associates (4 people) ---
  const fam14 = familyId();
  guests.push(
    g('Mukesh', 'Ambani', { familyId: fam14, familyName: 'Ambani', side: 'bride', relation: 'Business Associate', travelFrom: 'Johns Creek, GA', tags: ['VIP'], dietary: 'vegetarian' }),
    g('Shilpa', 'Ambani', { familyId: fam14, familyName: 'Ambani', side: 'bride', relation: 'Business Associate Wife', travelFrom: 'Johns Creek, GA' }),
  );

  guests.push(
    g('Hemant', 'Kothari', { side: 'bride', relation: 'Business Associate', travelFrom: 'Atlanta, GA', tags: ['VIP'] }),
    g('Ashwin', 'Naik', { side: 'bride', relation: 'Business Associate', travelFrom: 'Marietta, GA' }),
  );

  // --- More bride side families to reach ~150 ---
  const fam15 = familyId();
  guests.push(
    g('Kirit', 'Chauhan', { familyId: fam15, familyName: 'The Chauhan Family', side: 'bride', relation: 'Distant Uncle', travelFrom: 'Houston, TX', needsHotel: true }),
    g('Bharti', 'Chauhan', { familyId: fam15, familyName: 'The Chauhan Family', side: 'bride', relation: 'Distant Aunt', travelFrom: 'Houston, TX', needsHotel: true }),
    g('Parth', 'Chauhan', { familyId: fam15, familyName: 'The Chauhan Family', side: 'bride', relation: 'Distant Cousin', travelFrom: 'Houston, TX', needsHotel: true, dietary: 'non-veg' }),
  );

  const fam16 = familyId();
  guests.push(
    g('Biren', 'Doshi', { familyId: fam16, familyName: 'The Doshi Family', side: 'bride', relation: 'Mom\'s Cousin', travelFrom: 'Rajkot, India', needsHotel: true, language: 'gu' }),
    g('Pallavi', 'Doshi', { familyId: fam16, familyName: 'The Doshi Family', side: 'bride', relation: 'Mom\'s Cousin Wife', travelFrom: 'Rajkot, India', needsHotel: true, language: 'gu', dietary: 'jain' }),
    g('Tanay', 'Doshi', { familyId: fam16, familyName: 'The Doshi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Rajkot, India', needsHotel: true }),
    g('Neel', 'Doshi', { familyId: fam16, familyName: 'The Doshi Family', side: 'bride', relation: 'Cousin', travelFrom: 'Rajkot, India', needsHotel: true, tags: ['kids'], notes: 'Age 6' }),
  );

  const fam17 = familyId();
  guests.push(
    g('Girish', 'Raval', { familyId: fam17, familyName: 'The Raval Family', side: 'bride', relation: 'Family Friend (India)', travelFrom: 'Baroda, India', needsHotel: true }),
    g('Shobha', 'Raval', { familyId: fam17, familyName: 'The Raval Family', side: 'bride', relation: 'Family Friend (India)', travelFrom: 'Baroda, India', needsHotel: true }),
  );

  // Bride's cousins from Canada
  const fam18 = familyId();
  guests.push(
    g('Mayur', 'Shah', { familyId: fam18, familyName: 'Mayur Shah Family', side: 'bride', relation: 'Cousin (Canada)', travelFrom: 'Toronto, Canada', needsHotel: true, email: 'mayur.shah@rogers.ca' }),
    g('Nidhi', 'Shah', { familyId: fam18, familyName: 'Mayur Shah Family', side: 'bride', relation: 'Cousin\'s Wife', travelFrom: 'Toronto, Canada', needsHotel: true }),
    g('Aarohi', 'Shah', { familyId: fam18, familyName: 'Mayur Shah Family', side: 'bride', relation: 'Cousin\'s Daughter', travelFrom: 'Toronto, Canada', needsHotel: true, tags: ['kids'], notes: 'Age 3' }),
  );

  // More individuals
  guests.push(
    g('Sanjay', 'Raval', { side: 'bride', relation: 'Dad\'s Childhood Friend', travelFrom: 'Atlanta, GA', tags: ['elderly'] }),
    g('Madhu', 'Raval', { side: 'bride', relation: 'Dad\'s Childhood Friend Wife', travelFrom: 'Atlanta, GA', tags: ['elderly'] }),
    g('Dimple', 'Choksi', { side: 'bride', relation: 'Mom\'s Friend', travelFrom: 'Roswell, GA' }),
    g('Hetal', 'Vora', { side: 'bride', relation: 'Mom\'s Friend', travelFrom: 'Johns Creek, GA' }),
    g('Smita', 'Banker', { side: 'bride', relation: 'Mom\'s Friend', travelFrom: 'Suwanee, GA', dietary: 'jain' }),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // GROOM'S SIDE — ~150 guests
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Groom's Immediate Family (7 people) ---
  const fam19 = familyId();
  guests.push(
    g('Vikram', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Father of Groom', tags: ['VIP', 'immediate-family'], travelFrom: 'Cumming, GA', phone: '678-555-0501', email: 'vikram.patel@gmail.com', language: 'gu' }),
    g('Sonal', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Mother of Groom', tags: ['VIP', 'immediate-family'], travelFrom: 'Cumming, GA', phone: '678-555-0502', language: 'gu' }),
    g('Rushi', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Groom', tags: ['VIP', 'immediate-family'], travelFrom: 'Atlanta, GA', email: 'patel.rushi512@gmail.com' }),
    g('Nisha', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Sister of Groom', tags: ['immediate-family'], travelFrom: 'Charlotte, NC', needsHotel: true }),
    g('Jayanti', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Grandmother (Ba)', tags: ['VIP', 'elderly'], dietary: 'vegetarian', language: 'gu', notes: 'Needs ground floor seating, mobility issues' }),
    g('Kantilal', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Grandfather (Dada)', tags: ['VIP', 'elderly'], language: 'gu', notes: 'Hard of hearing — seat near speakers' }),
    g('Jignesh', 'Patel', { familyId: fam19, familyName: 'The Patel Family (Groom)', side: 'groom', relation: 'Brother of Groom', tags: ['immediate-family'], travelFrom: 'Cumming, GA' }),
  );

  // --- Groom's Paternal Uncle Family 1 (6 people, NJ) ---
  const fam20 = familyId();
  guests.push(
    g('Hitesh', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Paternal Uncle (Kaka)', tags: ['VIP'], travelFrom: 'Parsippany, NJ', needsHotel: true, phone: '973-555-0601' }),
    g('Darshana', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Paternal Aunt (Kaki)', travelFrom: 'Parsippany, NJ', needsHotel: true }),
    g('Kunal', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Cousin', travelFrom: 'Parsippany, NJ', needsHotel: true, email: 'kunal.patel@outlook.com', dietary: 'non-veg' }),
    g('Swati', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Cousin\'s Wife', travelFrom: 'Parsippany, NJ', needsHotel: true }),
    g('Aadhya', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Cousin\'s Daughter', travelFrom: 'Parsippany, NJ', needsHotel: true, tags: ['kids'], notes: 'Age 4, flower girl' }),
    g('Vihaan', 'Patel', { familyId: fam20, familyName: 'Hitesh Patel Family', side: 'groom', relation: 'Cousin\'s Son', travelFrom: 'Parsippany, NJ', needsHotel: true, tags: ['kids'], notes: 'Age 1, infant' }),
  );

  // --- Groom's Paternal Uncle Family 2 (5 people, India) ---
  const fam21 = familyId();
  guests.push(
    g('Pravin', 'Patel', { familyId: fam21, familyName: 'Pravin Patel Family', side: 'groom', relation: 'Paternal Uncle (Kaka)', travelFrom: 'Anand, India', needsHotel: true, language: 'gu', tags: ['VIP'] }),
    g('Kokilaben', 'Patel', { familyId: fam21, familyName: 'Pravin Patel Family', side: 'groom', relation: 'Paternal Aunt (Kaki)', travelFrom: 'Anand, India', needsHotel: true, language: 'gu' }),
    g('Chirag', 'Patel', { familyId: fam21, familyName: 'Pravin Patel Family', side: 'groom', relation: 'Cousin', travelFrom: 'Anand, India', needsHotel: true }),
    g('Foram', 'Patel', { familyId: fam21, familyName: 'Pravin Patel Family', side: 'groom', relation: 'Cousin', travelFrom: 'Anand, India', needsHotel: true }),
    g('Tejas', 'Patel', { familyId: fam21, familyName: 'Pravin Patel Family', side: 'groom', relation: 'Cousin', travelFrom: 'Anand, India', needsHotel: true, tags: ['kids'], notes: 'Age 16' }),
  );

  // --- Groom's Maternal Family (8 people — large family) ---
  const fam22 = familyId();
  guests.push(
    g('Ashok', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Maternal Uncle (Mama)', travelFrom: 'Surat, India', needsHotel: true, language: 'gu', tags: ['VIP'] }),
    g('Manjula', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Maternal Aunt (Mami)', travelFrom: 'Surat, India', needsHotel: true, language: 'gu' }),
    g('Deven', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true, email: 'deven.bhavsar@gmail.com' }),
    g('Rupal', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Cousin\'s Wife', travelFrom: 'Surat, India', needsHotel: true }),
    g('Kavish', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true }),
    g('Janki', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Cousin', travelFrom: 'Surat, India', needsHotel: true }),
    g('Om', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Nephew', travelFrom: 'Surat, India', needsHotel: true, tags: ['kids'], notes: 'Age 7' }),
    g('Myra', 'Bhavsar', { familyId: fam22, familyName: 'The Bhavsar Family', side: 'groom', relation: 'Niece', travelFrom: 'Surat, India', needsHotel: true, tags: ['kids'], notes: 'Age 5, flower girl' }),
  );

  // --- Groom's Fua/Fui Family (4 people) ---
  const fam23 = familyId();
  guests.push(
    g('Manish', 'Soni', { familyId: fam23, familyName: 'The Soni Family', side: 'groom', relation: 'Fua (Dad\'s Sister\'s Husband)', travelFrom: 'Detroit, MI', needsHotel: true }),
    g('Hansaben', 'Soni', { familyId: fam23, familyName: 'The Soni Family', side: 'groom', relation: 'Fui (Dad\'s Sister)', travelFrom: 'Detroit, MI', needsHotel: true, tags: ['VIP'] }),
    g('Jay', 'Soni', { familyId: fam23, familyName: 'The Soni Family', side: 'groom', relation: 'Cousin', travelFrom: 'Detroit, MI', needsHotel: true, email: 'jay.soni@gmail.com' }),
    g('Hiral', 'Soni', { familyId: fam23, familyName: 'The Soni Family', side: 'groom', relation: 'Cousin', travelFrom: 'Detroit, MI', needsHotel: true }),
  );

  // --- Groom's College Friends (Groomsmen + others) ---
  guests.push(
    g('Sahil', 'Mehta', { side: 'groom', relation: 'Best Friend / Best Man', travelFrom: 'New York, NY', needsHotel: true, email: 'sahil.mehta@icloud.com', dietary: 'non-veg', tags: ['VIP'], plusOne: true, plusOneName: 'Amanda Roberts' }),
    g('Kevin', 'O\'Brien', { side: 'groom', relation: 'College Friend (Groomsman)', travelFrom: 'Chicago, IL', needsHotel: true, email: 'kevin.obrien@gmail.com', dietary: 'non-veg', notes: 'First Indian wedding — send itinerary' }),
    g('Raj', 'Malhotra', { side: 'groom', relation: 'College Friend (Groomsman)', travelFrom: 'Atlanta, GA', email: 'raj.malhotra@tech.com', dietary: 'non-veg' }),
    g('Chris', 'Anderson', { side: 'groom', relation: 'College Friend (Groomsman)', travelFrom: 'Denver, CO', needsHotel: true, email: 'c.anderson@yahoo.com', dietary: 'non-veg', plusOne: true, plusOneName: 'Katie Anderson' }),
    g('Darshan', 'Rana', { side: 'groom', relation: 'College Friend', travelFrom: 'Boston, MA', needsHotel: true, email: 'darshan.rana@outlook.com' }),
    g('Neel', 'Kothari', { side: 'groom', relation: 'College Friend', travelFrom: 'Atlanta, GA', email: 'neel.k@gmail.com', dietary: 'non-veg' }),
    g('Ankit', 'Sharma', { side: 'groom', relation: 'College Friend', travelFrom: 'Washington, DC', needsHotel: true, email: 'ankit.sharma@gov.com' }),
    g('Tyler', 'Bennett', { side: 'groom', relation: 'College Friend', travelFrom: 'Atlanta, GA', email: 'tyler.b@gmail.com', dietary: 'non-veg', notes: 'Gluten-free needed' }),
    g('Hassan', 'Ali', { side: 'groom', relation: 'College Friend', travelFrom: 'Atlanta, GA', email: 'hassan.ali@gmail.com', dietary: 'non-veg', notes: 'Halal food preference' }),
    g('Vikash', 'Tiwari', { side: 'groom', relation: 'College Friend', travelFrom: 'Raleigh, NC', needsHotel: true, email: 'vikash.t@outlook.com' }),
  );

  // --- Groom's Work Colleagues ---
  guests.push(
    g('Alex', 'Petrov', { side: 'groom', relation: 'Work Friend (Manager)', travelFrom: 'Atlanta, GA', email: 'alex.petrov@corp.com', dietary: 'non-veg', tags: ['VIP'], plusOne: true, plusOneName: 'Maria Petrov' }),
    g('Siddharth', 'Dubey', { side: 'groom', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'sid.dubey@corp.com' }),
    g('Prachi', 'Kulkarni', { side: 'groom', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'prachi.k@corp.com' }),
    g('Jason', 'Park', { side: 'groom', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'jason.park@corp.com', dietary: 'non-veg' }),
    g('Meghan', 'Scott', { side: 'groom', relation: 'Work Friend', travelFrom: 'Atlanta, GA', email: 'meghan.s@corp.com', dietary: 'non-veg', plusOne: true, plusOneName: 'Brandon Scott' }),
    g('Varun', 'Garg', { side: 'groom', relation: 'Work Friend', travelFrom: 'Decatur, GA', email: 'varun.garg@corp.com' }),
  );

  // --- Groom's Community Friends (Parents' friends with families) ---
  const fam24 = familyId();
  guests.push(
    g('Jatin', 'Bhakta', { familyId: fam24, familyName: 'The Bhakta Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Cumming, GA' }),
    g('Nirmala', 'Bhakta', { familyId: fam24, familyName: 'The Bhakta Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Cumming, GA' }),
    g('Tirth', 'Bhakta', { familyId: fam24, familyName: 'The Bhakta Family', side: 'groom', relation: 'Community Friend (Son)', travelFrom: 'Cumming, GA' }),
    g('Krish', 'Bhakta', { familyId: fam24, familyName: 'The Bhakta Family', side: 'groom', relation: 'Community Friend (Son)', travelFrom: 'Cumming, GA', tags: ['kids'], notes: 'Age 11' }),
  );

  const fam25 = familyId();
  guests.push(
    g('Paresh', 'Mistry', { familyId: fam25, familyName: 'The Mistry Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Alpharetta, GA' }),
    g('Dipali', 'Mistry', { familyId: fam25, familyName: 'The Mistry Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Alpharetta, GA' }),
  );

  const fam26 = familyId();
  guests.push(
    g('Bipin', 'Gandhi', { familyId: fam26, familyName: 'The Gandhi Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Suwanee, GA', tags: ['elderly'] }),
    g('Chhaya', 'Gandhi', { familyId: fam26, familyName: 'The Gandhi Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Suwanee, GA', tags: ['elderly'] }),
    g('Dhara', 'Gandhi', { familyId: fam26, familyName: 'The Gandhi Family', side: 'groom', relation: 'Community Friend (Daughter)', travelFrom: 'Suwanee, GA', plusOne: true, plusOneName: 'Mike Chen' }),
  );

  const fam27 = familyId();
  guests.push(
    g('Lalit', 'Acharya', { familyId: fam27, familyName: 'The Acharya Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Roswell, GA' }),
    g('Gita', 'Acharya', { familyId: fam27, familyName: 'The Acharya Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Roswell, GA' }),
  );

  // --- Groom's extended - Mama from India (large family, 6 people) ---
  const fam28 = familyId();
  guests.push(
    g('Shailesh', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Maternal Uncle 2 (Mama)', travelFrom: 'Nadiad, India', needsHotel: true, language: 'gu' }),
    g('Minal', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Maternal Aunt 2 (Mami)', travelFrom: 'Nadiad, India', needsHotel: true, language: 'gu' }),
    g('Harsh', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Cousin', travelFrom: 'Nadiad, India', needsHotel: true }),
    g('Riddhi', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Cousin', travelFrom: 'Nadiad, India', needsHotel: true }),
    g('Urvi', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Cousin', travelFrom: 'Nadiad, India', needsHotel: true, tags: ['kids'], notes: 'Age 13' }),
    g('Manan', 'Oza', { familyId: fam28, familyName: 'The Oza Family', side: 'groom', relation: 'Cousin', travelFrom: 'Nadiad, India', needsHotel: true, tags: ['kids'], notes: 'Age 10' }),
  );

  // --- Groom's Maternal Grandmother (solo traveler from India) ---
  guests.push(
    g('Induben', 'Patel', { side: 'groom', relation: 'Maternal Grandmother (Nani)', travelFrom: 'Ahmedabad, India', needsHotel: true, tags: ['VIP', 'elderly'], language: 'gu', notes: 'Strict Jain diet, needs assistance, arriving 5 days early', dietary: 'jain' }),
  );

  // --- Groom's South Indian Friends (diverse backgrounds) ---
  const fam29 = familyId();
  guests.push(
    g('Ramesh', 'Krishnamurthy', { familyId: fam29, familyName: 'Krishnamurthy Family', side: 'groom', relation: 'Family Friend (South Indian)', travelFrom: 'Tampa, FL', needsHotel: true, language: 'ta', dietary: 'vegetarian' }),
    g('Lakshmi', 'Krishnamurthy', { familyId: fam29, familyName: 'Krishnamurthy Family', side: 'groom', relation: 'Family Friend', travelFrom: 'Tampa, FL', needsHotel: true, language: 'ta', dietary: 'vegetarian' }),
    g('Arun', 'Krishnamurthy', { familyId: fam29, familyName: 'Krishnamurthy Family', side: 'groom', relation: 'Family Friend Son', travelFrom: 'Tampa, FL', needsHotel: true }),
  );

  // --- Groom's Childhood/School Friends ---
  guests.push(
    g('Dev', 'Parmar', { side: 'groom', relation: 'School Friend', travelFrom: 'Atlanta, GA', email: 'dev.parmar@gmail.com' }),
    g('Hiren', 'Shah', { side: 'groom', relation: 'School Friend', travelFrom: 'Cumming, GA', email: 'hiren.shah@yahoo.com', plusOne: true, plusOneName: 'Pooja Shah' }),
    g('Aakash', 'Patel', { side: 'groom', relation: 'School Friend', travelFrom: 'Duluth, GA', email: 'aakash.p@gmail.com' }),
    g('Ronak', 'Desai', { side: 'groom', relation: 'School Friend', travelFrom: 'Johns Creek, GA', email: 'ronak.d@outlook.com', dietary: 'non-veg' }),
  );

  // --- Groom's Parents' friends (more couples) ---
  const fam30 = familyId();
  guests.push(
    g('Rasik', 'Patel', { familyId: fam30, familyName: 'Rasik Patel Family', side: 'groom', relation: 'Dad\'s Friend', travelFrom: 'Buford, GA' }),
    g('Urmila', 'Patel', { familyId: fam30, familyName: 'Rasik Patel Family', side: 'groom', relation: 'Dad\'s Friend Wife', travelFrom: 'Buford, GA' }),
  );

  const fam31 = familyId();
  guests.push(
    g('Yogesh', 'Barot', { familyId: fam31, familyName: 'The Barot Family', side: 'groom', relation: 'Mom\'s Friend', travelFrom: 'Cumming, GA' }),
    g('Heena', 'Barot', { familyId: fam31, familyName: 'The Barot Family', side: 'groom', relation: 'Mom\'s Friend', travelFrom: 'Cumming, GA' }),
    g('Shreya', 'Barot', { familyId: fam31, familyName: 'The Barot Family', side: 'groom', relation: 'Family Friend Daughter', travelFrom: 'Cumming, GA', tags: ['kids'], notes: 'Age 15' }),
  );

  const fam32 = familyId();
  guests.push(
    g('Chetan', 'Solanki', { familyId: fam32, familyName: 'The Solanki Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Peachtree City, GA' }),
    g('Rupal', 'Solanki', { familyId: fam32, familyName: 'The Solanki Family', side: 'groom', relation: 'Community Friend', travelFrom: 'Peachtree City, GA' }),
  );

  // --- Groom's UK Relatives (4 people) ---
  const fam33 = familyId();
  guests.push(
    g('Nilesh', 'Patel', { familyId: fam33, familyName: 'UK Patels', side: 'groom', relation: 'Dad\'s Cousin (UK)', travelFrom: 'Leicester, UK', needsHotel: true, email: 'nilesh.patel@bt.co.uk' }),
    g('Bhavna', 'Patel', { familyId: fam33, familyName: 'UK Patels', side: 'groom', relation: 'Dad\'s Cousin Wife', travelFrom: 'Leicester, UK', needsHotel: true }),
    g('Reena', 'Patel', { familyId: fam33, familyName: 'UK Patels', side: 'groom', relation: 'Cousin (UK)', travelFrom: 'Leicester, UK', needsHotel: true }),
    g('Samir', 'Patel', { familyId: fam33, familyName: 'UK Patels', side: 'groom', relation: 'Cousin (UK)', travelFrom: 'Leicester, UK', needsHotel: true }),
  );

  // --- Groom's Dad's Business Circle ---
  guests.push(
    g('Naveen', 'Reddy', { side: 'groom', relation: 'Business Associate', travelFrom: 'Atlanta, GA', tags: ['VIP'], email: 'naveen.r@business.com', dietary: 'non-veg', plusOne: true, plusOneName: 'Swapna Reddy' }),
    g('Kamal', 'Singh', { side: 'groom', relation: 'Business Associate', travelFrom: 'Marietta, GA', plusOne: true, plusOneName: 'Gurpreet Singh' }),
    g('Robert', 'Williams', { side: 'groom', relation: 'Business Associate (Non-Indian)', travelFrom: 'Atlanta, GA', dietary: 'non-veg', email: 'rwilliams@biz.com', notes: 'First Indian wedding' }),
  );

  // --- Groom's Gym/Sports Friends ---
  guests.push(
    g('Akshay', 'Kapadia', { side: 'groom', relation: 'Gym Friend', travelFrom: 'Atlanta, GA', email: 'akshay.k@gmail.com', dietary: 'non-veg' }),
    g('Brandon', 'Taylor', { side: 'groom', relation: 'Basketball League', travelFrom: 'Atlanta, GA', email: 'btaylor@yahoo.com', dietary: 'non-veg' }),
    g('Miguel', 'Santos', { side: 'groom', relation: 'Gym Friend', travelFrom: 'Atlanta, GA', dietary: 'non-veg', email: 'miguel.s@gmail.com' }),
  );

  // --- Groom's Distant family (fill remaining) ---
  const fam34 = familyId();
  guests.push(
    g('Dinesh', 'Patel', { familyId: fam34, familyName: 'Dinesh Patel Family', side: 'groom', relation: 'Dad\'s 2nd Cousin', travelFrom: 'Philadelphia, PA', needsHotel: true }),
    g('Jyotsna', 'Patel', { familyId: fam34, familyName: 'Dinesh Patel Family', side: 'groom', relation: 'Dad\'s 2nd Cousin Wife', travelFrom: 'Philadelphia, PA', needsHotel: true }),
    g('Aman', 'Patel', { familyId: fam34, familyName: 'Dinesh Patel Family', side: 'groom', relation: 'Distant Cousin', travelFrom: 'Philadelphia, PA', needsHotel: true }),
  );

  const fam35 = familyId();
  guests.push(
    g('Kaushik', 'Patel', { familyId: fam35, familyName: 'Kaushik Patel Family', side: 'groom', relation: 'Distant Uncle', travelFrom: 'Dallas, TX', needsHotel: true }),
    g('Rekha', 'Patel', { familyId: fam35, familyName: 'Kaushik Patel Family', side: 'groom', relation: 'Distant Aunt', travelFrom: 'Dallas, TX', needsHotel: true }),
    g('Sagar', 'Patel', { familyId: fam35, familyName: 'Kaushik Patel Family', side: 'groom', relation: 'Distant Cousin', travelFrom: 'Dallas, TX', needsHotel: true, email: 'sagar.patel@gmail.com' }),
    g('Shivani', 'Patel', { familyId: fam35, familyName: 'Kaushik Patel Family', side: 'groom', relation: 'Distant Cousin', travelFrom: 'Dallas, TX', needsHotel: true }),
  );

  // --- Groom's Mom's friends circle (temple group) ---
  guests.push(
    g('Vina', 'Joshi', { side: 'groom', relation: 'Mom\'s Temple Friend', travelFrom: 'Cumming, GA', language: 'gu' }),
    g('Hansa', 'Parikh', { side: 'groom', relation: 'Mom\'s Temple Friend', travelFrom: 'Alpharetta, GA', language: 'gu' }),
    g('Sarita', 'Rathod', { side: 'groom', relation: 'Mom\'s Temple Friend', travelFrom: 'Suwanee, GA', language: 'gu', plusOne: true, plusOneName: 'Mahendra Rathod' }),
    g('Kokila', 'Trivedi', { side: 'groom', relation: 'Mom\'s Temple Friend', travelFrom: 'Johns Creek, GA', language: 'gu', dietary: 'jain' }),
  );

  // --- Groom's Remaining friends and acquaintances ---
  guests.push(
    g('Pratik', 'Jobanputra', { side: 'groom', relation: 'Family Friend', travelFrom: 'Buford, GA', email: 'pratik.j@gmail.com' }),
    g('Nirav', 'Contractor', { side: 'groom', relation: 'Neighbor', travelFrom: 'Cumming, GA', plusOne: true, plusOneName: 'Helly Contractor' }),
    g('Bhavik', 'Dave', { side: 'groom', relation: 'Cricket Team', travelFrom: 'Duluth, GA', dietary: 'non-veg' }),
    g('Falgun', 'Patel', { side: 'groom', relation: 'Volleyball Friend', travelFrom: 'Roswell, GA' }),
    g('Smit', 'Panchal', { side: 'groom', relation: 'Graduate School Friend', travelFrom: 'San Jose, CA', needsHotel: true, email: 'smit.p@tech.com' }),
    g('Rina', 'Chaudhari', { side: 'groom', relation: 'Graduate School Friend', travelFrom: 'Austin, TX', needsHotel: true, email: 'rina.c@mail.com' }),
  );

  // Fill remaining to hit ~300 with more realistic community members
  const fam36 = familyId();
  guests.push(
    g('Sunil', 'Kapoor', { familyId: fam36, familyName: 'The Kapoor Family', side: 'groom', relation: 'Community Elder', travelFrom: 'Cumming, GA', tags: ['elderly'] }),
    g('Asha', 'Kapoor', { familyId: fam36, familyName: 'The Kapoor Family', side: 'groom', relation: 'Community Elder', travelFrom: 'Cumming, GA', tags: ['elderly'] }),
  );

  const fam37 = familyId();
  guests.push(
    g('Tushar', 'Vaidya', { familyId: fam37, familyName: 'The Vaidya Family', side: 'bride', relation: 'Dad\'s College Friend', travelFrom: 'Pune, India', needsHotel: true }),
    g('Seema', 'Vaidya', { familyId: fam37, familyName: 'The Vaidya Family', side: 'bride', relation: 'Dad\'s College Friend Wife', travelFrom: 'Pune, India', needsHotel: true }),
    g('Isha', 'Vaidya', { familyId: fam37, familyName: 'The Vaidya Family', side: 'bride', relation: 'Family Friend Daughter', travelFrom: 'Pune, India', needsHotel: true }),
  );

  guests.push(
    g('Mansi', 'Parmar', { side: 'bride', relation: 'Sorority Sister', travelFrom: 'Miami, FL', needsHotel: true, email: 'mansi.p@gmail.com', dietary: 'non-veg' }),
    g('Anjali', 'Saxena', { side: 'bride', relation: 'Yoga Class Friend', travelFrom: 'Atlanta, GA' }),
    g('Trupti', 'Bhatt', { side: 'bride', relation: 'Mom\'s Kitty Party Friend', travelFrom: 'Johns Creek, GA' }),
    g('Purnima', 'Rao', { side: 'bride', relation: 'Mom\'s Kitty Party Friend', travelFrom: 'Alpharetta, GA', dietary: 'vegetarian' }),
  );

  // More groom side fillers
  guests.push(
    g('Jeet', 'Thaker', { side: 'groom', relation: 'College Roommate', travelFrom: 'Phoenix, AZ', needsHotel: true, email: 'jeet.thaker@gmail.com', dietary: 'non-veg' }),
    g('Parth', 'Bhatt', { side: 'groom', relation: 'High School Friend', travelFrom: 'Cumming, GA' }),
    g('Nishant', 'Dalal', { side: 'groom', relation: 'Cousin\'s Friend', travelFrom: 'Atlanta, GA' }),
    g('Darshit', 'Modi', { side: 'groom', relation: 'Tennis Partner', travelFrom: 'Marietta, GA', dietary: 'non-veg' }),
  );

  // A couple more large families to push over 300
  const fam38 = familyId();
  guests.push(
    g('Ketanbhai', 'Patel', { familyId: fam38, familyName: 'Ketanbhai Family', side: 'groom', relation: 'Dad\'s Eldest Brother', travelFrom: 'Charotar, India', needsHotel: true, tags: ['VIP', 'elderly'], language: 'gu' }),
    g('Sharadaben', 'Patel', { familyId: fam38, familyName: 'Ketanbhai Family', side: 'groom', relation: 'Dad\'s Eldest Bhabhi', travelFrom: 'Charotar, India', needsHotel: true, tags: ['elderly'], language: 'gu', dietary: 'jain' }),
    g('Mitesh', 'Patel', { familyId: fam38, familyName: 'Ketanbhai Family', side: 'groom', relation: 'Eldest Cousin', travelFrom: 'Charotar, India', needsHotel: true }),
    g('Binal', 'Patel', { familyId: fam38, familyName: 'Ketanbhai Family', side: 'groom', relation: 'Cousin\'s Wife', travelFrom: 'Charotar, India', needsHotel: true }),
    g('Diya', 'Patel', { familyId: fam38, familyName: 'Ketanbhai Family', side: 'groom', relation: 'Cousin\'s Daughter', travelFrom: 'Charotar, India', needsHotel: true, tags: ['kids'], notes: 'Age 8' }),
  );

  return guests;
}

export default function SeedData() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [status, setStatus] = useState('idle');
  const [count, setCount] = useState(0);

  const handleSeed = async () => {
    if (!activeWedding) {
      setStatus('error: No active wedding selected');
      return;
    }

    const guests = generateGuests();
    setStatus(`Seeding ${guests.length} guests...`);
    setCount(guests.length);

    try {
      const ref = collection(db, COLLECTIONS.WEDDINGS, activeWedding.id, COLLECTIONS.GUESTS);

      // Firestore batch max is 500, so we can do it in one batch
      const batchSize = 499;
      for (let i = 0; i < guests.length; i += batchSize) {
        const chunk = guests.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach((guest) => {
          const docRef = doc(ref);
          batch.set(docRef, { ...guest, createdAt: serverTimestamp() });
        });
        await batch.commit();
        setStatus(`Written ${Math.min(i + batchSize, guests.length)} / ${guests.length}...`);
      }

      setStatus(`✅ Done! Seeded ${guests.length} guests into "${activeWedding.coupleName1 || 'wedding'}".`);
    } catch (err) {
      console.error('Seed error:', err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const guestPreview = generateGuests();
  const familyCount = new Set(guestPreview.filter(g => g.familyId).map(g => g.familyId)).size;
  const kidsCount = guestPreview.filter(g => g.tags.includes('kids')).length;
  const elderlyCount = guestPreview.filter(g => g.tags.includes('elderly')).length;
  const vipCount = guestPreview.filter(g => g.tags.includes('VIP')).length;
  const needsHotelCount = guestPreview.filter(g => g.needsHotel).length;
  const brideCount = guestPreview.filter(g => g.side === 'bride').length;
  const groomCount = guestPreview.filter(g => g.side === 'groom').length;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🌱 Seed Test Data</h1>
      <p className="text-gray-600 mb-6">
        This will create <strong>{guestPreview.length} realistic Indian wedding guests</strong> in your active wedding.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-wine-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-wine-700">{guestPreview.length}</div>
          <div className="text-xs text-gray-600">Total Guests</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-700">{familyCount}</div>
          <div className="text-xs text-gray-600">Families</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-700">{brideCount} / {groomCount}</div>
          <div className="text-xs text-gray-600">Bride / Groom</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-700">{needsHotelCount}</div>
          <div className="text-xs text-gray-600">Need Hotel</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-1">
        <p>📊 <strong>Coverage:</strong></p>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>{kidsCount} children (ages 1-16, includes infants, toddlers, teens)</li>
          <li>{elderlyCount} elderly guests (wheelchair/mobility notes)</li>
          <li>{vipCount} VIP guests (immediate family, elders, key people)</li>
          <li>Dietary: vegetarian, jain, non-veg, vegan, gluten-free, halal</li>
          <li>Travel: Atlanta locals, US cities, India, UK, Canada</li>
          <li>Languages: English, Gujarati, Hindi, Tamil</li>
          <li>Plus-ones with names (non-Indian partners)</li>
          <li>Family sizes: 2-8 members</li>
          <li>Relations: immediate, uncles/aunts, cousins, friends, colleagues, community</li>
        </ul>
      </div>

      {activeWedding ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Active wedding: <strong>{activeWedding.coupleName1} & {activeWedding.coupleName2}</strong> ({activeWedding.id})
          </p>
          <Button onClick={handleSeed} disabled={status.startsWith('Seeding') || status.startsWith('Written')}>
            {status === 'idle' ? `Seed ${guestPreview.length} Guests` : status.startsWith('✅') ? 'Done!' : 'Seeding...'}
          </Button>
          {status !== 'idle' && (
            <p className={`text-sm ${status.startsWith('❌') ? 'text-red-600' : status.startsWith('✅') ? 'text-green-600' : 'text-gray-600'}`}>
              {status}
            </p>
          )}
        </div>
      ) : (
        <p className="text-red-600">⚠️ No active wedding. Go to Dashboard and select/create a wedding first.</p>
      )}
    </div>
  );
}
