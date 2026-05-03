# Requirements Document

## Introduction

Cal Poly Dining Reviews is a web application that allows Cal Poly students to discover, rate, and review individual menu items across Cal Poly's on-campus dining restaurants. Unlike traditional restaurant review platforms, this app focuses on item-level reviews — recognizing that menus change frequently and that a student's decision to spend dining dollars is driven by what's on the menu today, not just which restaurant to visit. The app is built for the KiroHacks Hackathon and demonstrates Human-Centered Design by centering the student dining experience.

## Glossary

- **Student**: A Cal Poly student who uses the application to browse menus and submit reviews.
- **Dining_System**: Cal Poly's on-campus network of dining restaurants and food venues.
- **Restaurant**: An individual on-campus dining venue (e.g., 19 Metro Station, Vista Grande, Poly Eats).
- **Menu**: The collection of food and beverage items currently offered by a Restaurant.
- **Menu_Item**: A specific food or beverage offering at a Restaurant, identified by name and Restaurant.
- **Review**: A Student-submitted rating and optional text comment associated with a specific Menu_Item.
- **Rating**: A numeric score from 1 to 5 (inclusive) assigned to a Menu_Item within a Review.
- **Dining_Dollars**: The campus currency used by Students to purchase food at Dining_System restaurants.
- **App**: The Cal Poly Dining Reviews web application.
- **Feed**: A chronologically ordered list of recent Reviews visible to all Students.
- **Search**: The App's functionality for finding Restaurants or Menu_Items by keyword.

---

## Requirements

### Requirement 1: Browse Restaurants and Menus

**User Story:** As a Student, I want to browse all on-campus Restaurants and their current Menus, so that I can decide where to spend my Dining Dollars.

#### Acceptance Criteria

1. THE App SHALL display a list of all Restaurants in the Dining_System.
2. WHEN a Student selects a Restaurant, THE App SHALL display the Restaurant's current Menu.
3. THE App SHALL display each Menu_Item's name, description (if available), and current average Rating.
4. WHEN a Menu changes, THE App SHALL reflect the updated Menu in real time.
5. IF a Restaurant has no Menu_Items, THEN THE App SHALL display a message indicating the Menu is currently unavailable.

---

### Requirement 2: View Menu Item Reviews

**User Story:** As a Student, I want to read Reviews for individual Menu_Items, so that I can make informed decisions about what to eat.

#### Acceptance Criteria

1. WHEN a Student selects a Menu_Item, THE App SHALL display all Reviews associated with that Menu_Item.
2. THE App SHALL display each Review's Rating, text comment (if provided), and submission timestamp.
3. THE App SHALL display the average Rating for a Menu_Item calculated from all submitted Reviews.
4. WHEN no Reviews exist for a Menu_Item, THE App SHALL display a message indicating no Reviews have been submitted yet.
5. THE App SHALL display Reviews in reverse chronological order (most recent first).

---

### Requirement 3: Submit a Review

**User Story:** As a Student, I want to submit a Rating and optional comment for a Menu_Item I have tried, so that I can share my experience with other Students.

#### Acceptance Criteria

1. WHEN a Student submits a Review, THE App SHALL require a Rating between 1 and 5 inclusive.
2. WHEN a Student submits a Review, THE App SHALL accept an optional text comment of up to 500 characters.
3. WHEN a Student submits a valid Review, THE App SHALL store the Review and associate it with the correct Menu_Item and Restaurant.
4. WHEN a Student submits a valid Review, THE App SHALL display the new Review in the Menu_Item's Review list within 5 seconds.
5. IF a Student submits a Review with a Rating outside the range of 1 to 5, THEN THE App SHALL reject the submission and display a descriptive error message.
6. IF a Student submits a Review with a text comment exceeding 500 characters, THEN THE App SHALL reject the submission and display a descriptive error message.
7. WHEN a Student submits a valid Review, THE App SHALL recalculate and display the updated average Rating for the Menu_Item.

---

### Requirement 4: Student Authentication

**User Story:** As a Student, I want to sign in with my Cal Poly credentials, so that my Reviews are associated with my identity and the community can trust the authenticity of Reviews.

#### Acceptance Criteria

1. Anyone can submit a review, the app does not require authentication.

---

### Requirement 5: Search for Menu Items and Restaurants

**User Story:** As a Student, I want to search for specific Menu_Items or Restaurants by name, so that I can quickly find Reviews for food I am interested in.

#### Acceptance Criteria

1. THE App SHALL provide a Search input accessible from every page.
2. WHEN a Student enters a keyword in Search, THE App SHALL return matching Restaurants and Menu_Items whose names contain the keyword (case-insensitive).
3. WHEN Search returns results, THE App SHALL display each result's name, associated Restaurant (for Menu_Items), and average Rating.
4. WHEN Search returns no results, THE App SHALL display a message indicating no matches were found.
5. WHEN a Student selects a Search result, THE App SHALL navigate to the corresponding Restaurant or Menu_Item page.
6. IF a Student submits a Search query shorter than 2 characters, THEN THE App will still attempt to list out the closest restaurants that match with the character

---

### Requirement 6: Community Review Feed

**User Story:** As a Student, I want to see a Feed of recent Reviews from the campus community, so that I can discover popular or trending Menu_Items.

#### Acceptance Criteria

1. THE App SHALL display a Feed of the 50 most recent Reviews across all Restaurants and Menu_Items.
2. THE Feed SHALL display each Review's Menu_Item name, Restaurant name, Rating, text comment (if provided), and submission timestamp.
3. WHEN a new Review is submitted, THE App SHALL include it in the Feed within 5 seconds.
4. WHEN a Student selects a Review in the Feed, THE App SHALL navigate to the corresponding Menu_Item page.
5. THE Feed SHALL be accessible to unauthenticated users.

---

### Requirement 7: Menu Item and Review Data Persistence

**User Story:** As a Student, I want Reviews to persist across sessions, so that the community's collective knowledge is preserved over time.

#### Acceptance Criteria

1. THE App SHALL persist all submitted Reviews in a database.
2. THE App SHALL persist all Restaurant and Menu_Item data in a database.
3. WHEN the App restarts, THE App SHALL restore all previously persisted Reviews, Restaurants, and Menu_Items.
4. IF a database write operation fails, THEN THE App SHALL display a descriptive error message to the Student and SHALL NOT silently discard the Review.

---

### Requirement 9: User-Submitted Menu Items

**User Story:** As a Student, I want to add a missing Menu_Item to a Restaurant's menu, so that I can leave a Review for food that isn't listed yet.

#### Acceptance Criteria

1. THE App SHALL provide an "Add Menu Item" button accessible from any Restaurant's menu page.
2. WHEN a Student clicks "Add Menu Item", THE App SHALL display a modal prompt with a text field for the item name and a dropdown list of all Restaurants to select from.
3. THE modal SHALL require both a non-empty item name and a selected Restaurant before allowing submission.
4. WHEN a Student submits a valid new Menu_Item, THE App SHALL add it to the selected Restaurant's menu and make it immediately available for Reviews.
5. IF a Student submits a Menu_Item name that already exists at the selected Restaurant (case-insensitive), THEN THE App SHALL reject the submission and display a message indicating the item already exists.
6. WHEN a Student submits a valid new Menu_Item, THE App SHALL close the modal and navigate to the new Menu_Item's page.

---

### Requirement 10: Report System

**User Story:** As a Student, I want to report an inappropriate Review or incorrect Menu_Item, so that the community's content remains accurate and respectful.

#### Acceptance Criteria

1. THE App SHALL provide a "Report" option on every Review and every user-submitted Menu_Item.
2. WHEN a Student clicks "Report", THE App SHALL display a prompt asking for a brief reason for the report.
3. WHEN a Student submits a Report, THE App SHALL store the Report and notify management via email.
4. WHEN a Report is submitted, THE App SHALL display a confirmation message to the Student indicating the Report has been received.
5. THE App SHALL include in the management notification: the reported content (Review text or Menu_Item name), the associated Restaurant, the report reason, and the submission timestamp.
6. IF the notification delivery fails, THEN THE App SHALL still store the Report in the database and retry delivery.

---

### Requirement 8: Responsive and Accessible Interface

**User Story:** As a Student, I want to use the App on my phone or laptop, so that I can look up Reviews while standing in line at a Restaurant.

#### Acceptance Criteria

1. THE App SHALL render correctly on screen widths between 320px and 1920px.
2. THE App SHALL meet WCAG 2.1 Level AA accessibility standards for all interactive elements.
3. THE App SHALL display page content within 3 seconds on a standard campus Wi-Fi connection.
4. WHEN a Student navigates between pages, THE App SHALL complete the navigation transition within 1 second.
