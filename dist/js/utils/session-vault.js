/**
 * TECHTIS (techtis.in) - Session Temporary DB & Multi-Document Profile Vault
 * Allows users to upload multiple documents (Aadhaar, PAN, Marksheet, Passports) in one session,
 * automatically merges them into a Unified Master Profile, and preserves everything without truncation.
 */

export const SessionDocVault = {
    STORAGE_KEY: 'techtis_session_vault_v1',

    getVault() {
        try {
            const raw = sessionStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : { docs: [], activeId: 'master' };
        } catch (_) {
            return { docs: [], activeId: 'master' };
        }
    },

    saveVault(vault) {
        try {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(vault));
        } catch (_) {}
    },

    getDocs() {
        return this.getVault().docs || [];
    },

    getActiveId() {
        return this.getVault().activeId || 'master';
    },

    setActiveId(id) {
        const vault = this.getVault();
        vault.activeId = id;
        this.saveVault(vault);
    },

    addDocument(docData) {
        const vault = this.getVault();
        const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        const newDoc = {
            id: docId,
            name: docData.name || `Document ${vault.docs.length + 1}`,
            docType: docData.docType || 'Document',
            previewUrl: docData.previewUrl || '',
            extracted: docData.extracted || {},
            timestamp: new Date().toISOString()
        };

        vault.docs.push(newDoc);
        vault.activeId = docId;
        this.saveVault(vault);
        return newDoc;
    },

    updateDocumentFields(docId, updatedFields) {
        const vault = this.getVault();
        const doc = vault.docs.find(d => d.id === docId);
        if (doc) {
            doc.extracted = { ...doc.extracted, ...updatedFields };
            this.saveVault(vault);
        }
    },

    removeDocument(docId) {
        const vault = this.getVault();
        vault.docs = vault.docs.filter(d => d.id !== docId);
        if (vault.activeId === docId) {
            vault.activeId = vault.docs.length > 0 ? vault.docs[vault.docs.length - 1].id : 'master';
        }
        this.saveVault(vault);
    },

    clearAll() {
        try {
            sessionStorage.removeItem(this.STORAGE_KEY);
        } catch (_) {}
    },

    /**
     * Compute a Unified Master Profile merging details across all uploaded session documents
     */
    getMasterProfile() {
        const docs = this.getDocs();

        if (docs.length === 0) {
            return {
                docType: 'Master Profile',
                name: '',
                email: '',
                phone: '',
                dob: '',
                gender: '',
                fatherName: '',
                address: '',
                pincode: '',
                allFields: [],
                docsCount: 0
            };
        }

        let name = '';
        let email = '';
        let phone = '';
        let dob = '';
        let gender = '';
        let fatherName = '';
        let address = '';
        let pincode = '';
        const allFields = [];
        const seenLabels = new Set();

        docs.forEach((doc, idx) => {
            const ext = doc.extracted || {};
            if (!name && ext.name) name = ext.name;
            if (!email && ext.email) email = ext.email;
            if (!phone && ext.phone) phone = ext.phone;
            if (!dob && ext.dob) dob = ext.dob;
            if (!gender && ext.gender) gender = ext.gender;
            if (!fatherName && ext.fatherName) fatherName = ext.fatherName;
            if ((!address || address.length < (ext.address || '').length) && ext.address) address = ext.address;
            if (!pincode && ext.pincode) pincode = ext.pincode;

            // Add Document Number (e.g. Aadhaar Number, PAN Number)
            if (ext.idNumber) {
                const label = `${doc.docType || 'Document'} Number`;
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    allFields.push({
                        key: `doc_${idx}_id`,
                        label: label,
                        value: ext.idNumber,
                        icon: 'credit-card',
                        docSource: doc.name
                    });
                }
            }

            // Include any additional recognized key-value pairs
            if (Array.isArray(ext.allFields)) {
                ext.allFields.forEach(f => {
                    if (f.value && !seenLabels.has(f.label)) {
                        seenLabels.add(f.label);
                        allFields.push({ ...f, docSource: doc.name });
                    }
                });
            }
        });

        // Ensure foundational form fields are present in Master Profile
        const coreFields = [
            { key: 'name', label: 'Full Name', value: name, icon: 'user' },
            { key: 'email', label: 'Email Address', value: email, icon: 'mail' },
            { key: 'phone', label: 'Phone / Mobile', value: phone, icon: 'phone' },
            { key: 'dob', label: 'Date of Birth', value: dob, icon: 'calendar' },
            { key: 'gender', label: 'Gender', value: gender, icon: 'user-check' },
            { key: 'fatherName', label: "Father / Guardian's Name", value: fatherName, icon: 'users' },
            { key: 'pincode', label: 'PIN / Postal Code', value: pincode, icon: 'map-pin' },
            { key: 'address', label: 'Full Residential Address', value: address, icon: 'home', isMultiLine: true }
        ];

        coreFields.forEach(cf => {
            if (cf.value && !allFields.some(f => f.key === cf.key)) {
                allFields.unshift(cf);
            }
        });

        return {
            docType: `Unified Master Profile (${docs.length} Document${docs.length > 1 ? 's' : ''} Combined)`,
            name,
            email,
            phone,
            dob,
            gender,
            fatherName,
            address,
            pincode,
            allFields,
            docsCount: docs.length
        };
    }
};
