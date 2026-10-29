-- =============================================
-- DATI DI TEST: AziendaEdile
-- =============================================

-- 1. Utenti
INSERT INTO utente (CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda)
VALUES
('ADMIN001', 'Pasquale', 'Pagano', 'admin123', '2003-12-03', 'AS', '3911555786', 'AziendaEdile'),
('RSSMRA80A01H501U', 'Mario', 'Rossi', '123', '1980-01-01', 'AA', '123456789', 'Sample S.p.a.'),
('VRDLGI85M15F205Z', 'Luigi', 'Verdi', 'capo123', '1985-08-15', 'CC', '3331122334', 'Sample S.p.a.'),
('BNCLRA92R50H501W', 'Laura', 'Bianchi', 'operaio123', '1992-10-10', 'OP', '3339988776', 'Sample S.p.a.'),
('NRMGPP95A01F205K', 'Giuseppe', 'Neri', 'operaio123', '1995-01-01', 'OP', '3335544332', 'Sample S.p.a.'),
('GLLMRC90T20H501J', 'Marco', 'Gialli', 'operaio123', '1990-12-20', 'OP', '3332211445', 'Sample S.p.a.')
ON DUPLICATE KEY UPDATE Nome=VALUES(Nome);

-- 2. Cantieri
INSERT INTO cantiere (QRCode, QRImage, Via, Citta, Civico, CAP, CFCapo, Stato)
VALUES
('CANT-RM-001', NULL, 'Via del Corso', 'Roma', '120', '00186', 'VRDLGI85M15F205Z', 'IN'),
('CANT-MI-002', NULL, 'Corso Buenos Aires', 'Milano', '45', '20124', 'VRDLGI85M15F205Z', 'DA'),
('CANT-NA-003', NULL, 'Via Toledo', 'Napoli', '88', '80134', NULL, 'SO')
ON DUPLICATE KEY UPDATE Via=VALUES(Via);

-- 3. Assegnazione Operai ai Cantieri (lavora)
INSERT INTO lavora (CF_U, QRCode_C)
VALUES
('VRDLGI85M15F205Z', 'CANT-RM-001'),
('BNCLRA92R50H501W', 'CANT-RM-001'),
('NRMGPP95A01F205K', 'CANT-RM-001'),
('BNCLRA92R50H501W', 'CANT-MI-002'),
('GLLMRC90T20H501J', 'CANT-MI-002')
ON DUPLICATE KEY UPDATE CF_U=VALUES(CF_U);

-- 4. Presenze operai
INSERT INTO presenza (DataPresenza, OraInizio, OraFine, CF_U)
VALUES
('2026-10-28', '08:00:00', '17:00:00', 'BNCLRA92R50H501W'),
('2026-10-28', '08:30:00', '17:30:00', 'NRMGPP95A01F205K'),
('2026-10-29', '08:00:00', '16:30:00', 'BNCLRA92R50H501W'),
('2026-10-29', '07:45:00', '16:45:00', 'VRDLGI85M15F205Z'),
('2026-10-30', '08:00:00', NULL, 'BNCLRA92R50H501W')
ON DUPLICATE KEY UPDATE OraInizio=VALUES(OraInizio);

-- 5. Beni
INSERT INTO bene (ID, Marca, Modello)
VALUES
('BEN00001', 'Caterpillar', 'Escavatore 320'),
('BEN00002', 'Iveco', 'Daily 35C15'),
('BEN00003', 'Fiat', 'Ducato Maxi'),
('BEN00004', 'Bosch', 'Martello Demolitore GSH 11 E'),
('BEN00005', 'Hilti', 'Trapano a Percussione TE 70'),
('BEN00006', 'Makita', 'Smerigliatrice GA9020'),
('BEN00007', 'DeWalt', 'Sega Circolare DWE575K')
ON DUPLICATE KEY UPDATE Marca=VALUES(Marca);

-- 6. Veicoli
INSERT INTO veicolo (Targa, Anno, ID_V)
VALUES
('AA123BB', 2021, 'BEN00001'),
('FX456YZ', 2020, 'BEN00002'),
('GH789KL', 2022, 'BEN00003')
ON DUPLICATE KEY UPDATE Anno=VALUES(Anno);

-- 7. Attrezzi
INSERT INTO attrezzo (Seriale, Tipo, ID_A)
VALUES
('SN-BSH-99881', 'Martello Demolitore', 'BEN00004'),
('SN-HLT-55442', 'Trapano a Percussione', 'BEN00005'),
('SN-MKT-11223', 'Smerigliatrice Angolare', 'BEN00006'),
('SN-DEW-77889', 'Sega Circolare', 'BEN00007')
ON DUPLICATE KEY UPDATE Tipo=VALUES(Tipo);

-- 8. Tracciamento Beni
INSERT INTO tracciamento (QRCode_C, ID_B, DataTracciamento, InDeposito)
VALUES
('CANT-RM-001', 'BEN00001', '2026-10-25 09:00:00', 0),
('CANT-RM-001', 'BEN00004', '2026-10-26 10:15:00', 0),
('CANT-MI-002', 'BEN00002', '2026-10-27 14:00:00', 0),
(NULL,          'BEN00003', '2026-10-28 11:30:00', 1),
(NULL,          'BEN00005', '2026-10-28 11:30:00', 1),
('CANT-RM-001', 'BEN00006', '2026-10-29 08:30:00', 0),
(NULL,          'BEN00007', '2026-10-29 17:00:00', 1);
