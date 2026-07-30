-- Clinic Appointment & Patient Desk — Unified/Reconciled Database Schema
-- Resolves discrepancies between documentation sections 6.2 (summary) and 6.3 (detailed schema),
-- and incorporates gap-analysis recommendations (soft deletes, role constraint, double-booking guard,
-- structured doctor availability).

CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(100) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    role           VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
    email          VARCHAR(100) UNIQUE,
    phone          VARCHAR(15),
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    doctor_id       SERIAL PRIMARY KEY,
    doctor_name     VARCHAR(100) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    phone           VARCHAR(15),
    email           VARCHAR(100) UNIQUE,
    experience      INT,
    is_active       BOOLEAN DEFAULT TRUE,  -- replaces hard delete
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structured replacement for the free-text doctors.availability field
CREATE TABLE doctor_availability (
    availability_id SERIAL PRIMARY KEY,
    doctor_id       INT NOT NULL REFERENCES doctors(doctor_id),
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun ... 6=Sat
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    CHECK (end_time > start_time)
);

CREATE TABLE patients (
    patient_id    SERIAL PRIMARY KEY,
    patient_name  VARCHAR(100) NOT NULL,
    age           INT,
    gender        VARCHAR(10),
    phone         VARCHAR(15),
    email         VARCHAR(100),
    address       TEXT,
    blood_group   VARCHAR(5),
    is_active     BOOLEAN DEFAULT TRUE,  -- replaces hard delete
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    appointment_id     SERIAL PRIMARY KEY,
    patient_id         INT NOT NULL REFERENCES patients(patient_id),
    doctor_id          INT NOT NULL REFERENCES doctors(doctor_id),
    appointment_date   DATE NOT NULL,
    appointment_time   TIME NOT NULL,
    reason             TEXT,
    status             VARCHAR(20) DEFAULT 'Scheduled',
    remarks            TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevents double-booking the same doctor at the same date/time
    UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- Indexes
CREATE INDEX idx_patients_name ON patients(patient_name);
CREATE INDEX idx_doctors_name ON doctors(doctor_name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
