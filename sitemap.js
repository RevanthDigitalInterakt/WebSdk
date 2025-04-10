document.addEventListener("DOMContentLoaded", function () {
    SalesforceInteractions.init({
        cookieDomain: 'devinfinitylearn.in',
        consents: new Promise(resolve => {
            // Default to opt-in
            resolve([{
                provider: 'Test Provider',
                purpose: SalesforceInteractions.ConsentPurpose.Tracking,
                status: SalesforceInteractions.ConsentStatus.OptIn
            }]);
        })


    }).then(() => {
        // set the log level during sitemap development to see potential problems
        console.log('Salesforce Interactions WEB SDK is ready');
        SalesforceInteractions.setLoggingLevel('DEBUG');


        let href = window.location.href;

        let hasExecuted = false;

        // Monitor the URL for changes
        setInterval(() => {



            if (href !== window.location.href) {
                href = window.location.href;

                // Check if the URL matches the 'Thank You' page
                if (window.location.href === 'https://ilwebsite2.devinfinitylearn.in/score/thankyou') {
                    // Reinitialize Salesforce interactions on the thank you page
                    SalesforceInteractions.reinit();
                    console.log("Salesforce Reinitialized on Thank You page");


                }

                // Check if the URL matches the 'View Test Report' page
                if (window.location.href === 'https://student.devinfinitylearn.in/dashboard/viewtestreport') {
                    console.log("In refresh for viewtestreport");

                    // Reinitialize Salesforce interactions on the viewtestreport page
                    SalesforceInteractions.reinit();

                    // Execute the function to collect test report data
                    executeViewTestReport();
                    console.log("done test report");
                }

                

                if (!hasExecuted && (window.location.href.includes('/payementVerification'))) {

                    // console.log("Report details capturing");
                    hasExecuted = true; // Prevent multiple executions
                    executeIdPaymentStatus();
                }

            }
        }, 1000);

        function executeIdPaymentStatus(){

            const successElement = document.querySelector(".section-heading");

                    function generateUniqueId() {
                        return `id_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
                    }

                    // Payment Success Logic
                    if (successElement && successElement.innerText.includes("Congratulation")) {
                        const name = successElement.innerText.replace("Congratulation, ", "").replace("!", "").trim();

                        const text = document.querySelector(".section-subheading.sm")?.innerText || "";

                        const container = document.querySelector('.center-heading-area');

                        let capturedAmount = "0.00";

                        if (container) {
                            const text1 = container.innerText;
                            console.log("Full Text:", text);

                            // Match amount like 38,415.02 (with or without ₹ symbol)
                            const amountMatch = text1.match(/(?:₹\s*)?([\d,]+\.\d{1,2})/);
                            capturedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : "0.00";

                            console.log("Captured Amount:", capturedAmount);  // Output: 38415.02
                        }


                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Payment status",
                                eventType: "payment",
                                attributes: {
                                    PaymentStatus: "Congratulations"
                                }
                            }
                        });
                    }

                    const failureElement = document.querySelector('.SUBCRP-pymnt-fail-error-msg');

                    // Payment Failure Logic
                    if (failureElement && failureElement.innerText.toLowerCase().includes('failed')) {
                        const failureText = failureElement.innerText;

                        const container = document.querySelector('.center-heading-area');
                        const text = container?.innerText || "";

                        // Regex to capture amount with or without ₹ symbol
                        const amountMatch = text.match(/(?:₹\s*)?([\d,]+\.\d+)/);

                        // Extract amount and remove commas
                        const capturedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : "0.00";

                        // Just log it nicely
                        console.log(`Captured Amount: Rs. ${capturedAmount}`);

                        // PaymentCapture.handlePaymentCaptured("Failed", failedAmount);

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Payment status captured",
                                eventType: "payment",
                                attributes: {
                                    PaymentStatus: "Failed"
                                }
                            }
                        });
                    }

        }

        // Function to execute when on the View Test Report page
        function executeViewTestReport() {
            setTimeout(() => {

                const examNameElement = document.querySelector('.UNFAPP-hdng.UNFAPP-main-hdng');
                const stuexamName = examNameElement ? examNameElement.textContent.trim() : 'Exam name not found';

                console.log("Exam Name:", stuexamName);
                //  sessionStorage.setItem("ExamName", stuexamName);
                const elements = document.querySelectorAll('.UNFAPP-cunt.UNFAPP-elips');
                console.log("Checking elements for View Report");

                // If there are enough elements, proceed with extracting data
                if (elements.length >= 5) {
                    // const totaltt = elements[0].textContent.trim();
                    // console.log("Total Time Taken:", totaltt);

                    const ttt = elements[1].textContent.trim();
                    console.log("TTT:", ttt);

                    const accuracy = elements[2].textContent.trim();
                    console.log("Accuracy:", accuracy);

                    const avgtime = elements[3].textContent.trim();
                    console.log("Avg. Time per Question:", avgtime);

                    const score = elements[4].textContent.trim();
                    console.log("Score:", score);

                    // Send collected data to Salesforce
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Student Report',
                            eventType: 'CustomEvent',
                            attributes: {
                                Score: score,
                                TimeTaken: ttt,
                                StudentExamName: stuexamName,   //change here
                                Accuracy: accuracy,
                                AvgTimePerQuestion: avgtime,
                            },
                        },
                    });
                } else {
                    console.log("Not enough elements found for View Report.");
                }
            }, 500);  // Allowing some time for elements to load before extracting data
        }


        function selectedpm() {
            // Get the selected payment method
            let headingElement = document.querySelector(".subscrp-sctn-hdng");
            let paymentMethod = headingElement ? headingElement.textContent.trim() : "";

            console.log("Payment Method:", paymentMethod);

            let paymentMethodType = "Unknown";
            if (paymentMethod.includes("UPI")) {
                paymentMethodType = "UPI";
            } else if (paymentMethod.includes("Wallets")) {
                paymentMethodType = "Wallets";
            } else if (paymentMethod.includes("Credit / Debit Card")) {
                paymentMethodType = "Credit / Debit Card";
            } else if (paymentMethod.includes("Netbanking")) {
                paymentMethodType = "Netbanking";
            }

            // Fetch billing summary values
            let subtotal = "0", discount = "0", grandTotal = "0";

            document.querySelectorAll('.SUBCRP-cart-review-list li').forEach((item) => {
                let label = item.querySelector('span')?.innerText?.trim();
                let valueElement = item.querySelector('div'); // Select the direct <div> containing the value

                if (label === 'Subtotal') {
                    subtotal = valueElement?.innerText.replace(/[^\d.]/g, '') || "0";
                } else if (label?.includes('Discount')) {
                    discount = valueElement?.innerText.replace(/[^\d.]/g, '') || "0";
                } else if (label === 'Grand Total') {
                    grandTotal = valueElement?.innerText.replace(/[^\d.]/g, '') || "0";
                }
            });

            console.log('Subtotal:', subtotal);
            console.log('Discount:', discount);
            console.log('Grand Total:', grandTotal);

            // Send event to SalesforceInteractions

            if (paymentMethodType != "Unknown") {
                SalesforceInteractions.sendEvent({
                    interaction: {
                        name: 'Payment Method captured',
                        eventType: 'payment',
                        attributes: {
                            PaymentMethod: paymentMethodType,
                            SubTotal: parseFloat(subtotal),
                            Discount: parseFloat(discount),
                            GrandTotal: parseFloat(grandTotal)
                        },
                    },
                });
            }
        }

        // MutationObserver to detect when user manually switches payment method
        const observer = new MutationObserver(() => {

            if (window.location.href === "https://student.devinfinitylearn.in/subscription/mycart") {
                console.log("Payment method selection changed...");

                let headingElement = document.querySelector(".subscrp-sctn-hdng");
                let newPaymentMethod = headingElement ? headingElement.textContent.trim() : "";


                if (newPaymentMethod !== selectedPaymentMethod) {
                    selectedPaymentMethod = newPaymentMethod; // Update to new method
                    console.log(`New payment method selected: ${selectedPaymentMethod}`);



                    // document.querySelector(".pymnt-blue-btn")?.addEventListener("click", () => {
                    //     selectedpm();
                    // });

                    const paymentButton = document.querySelector(".pymnt-blue-btn");

                    if (paymentButton) {
                        paymentButton.addEventListener("click", () => {
                            selectedpm();
                        });
                    }



                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // function handlePaymentClick(event) {
        //     const clickedBox = event.currentTarget;
        //     const blueBox = clickedBox.closest('.subscrp-blue-brdbox');
        //     const methodTitle = blueBox?.querySelector('.subscrp-blue-hdng');
        //     const methodName = methodTitle?.innerText.trim() || '';
        
        //     console.log('Payment Method:', methodName);
        
        //     // Extract prices
        //     const items = document.querySelectorAll('.SUBCRP-cart-review-list li');
        
        //     let subtotalElement1, discountElement1, grandTotalElement1;
        
        //     items.forEach((item) => {
        //         const label = item.querySelector('span')?.innerText?.trim();
        
        //         if (label === 'Subtotal') {
        //             subtotalElement1 = item.querySelector('.review-bold-text');
        //         } else if (label?.includes('Discount')) {
        //             discountElement1 = item.querySelector('.review-bold-text');
        //         } else if (label === 'Grand Total') {
        //             grandTotalElement1 = item.querySelector('div.review-bold-text, div.review-blue-txt.review-bold-text');
        //         }
        //     });
        
        //     const subtotal = subtotalElement1?.innerText.replace(/[^\d.]/g, '') || "0";
        //     const discount = discountElement1?.innerText.replace(/[^\d.]/g, '') || "0";
        //     const grandTotal = grandTotalElement1?.innerText.replace(/[^\d.]/g, '') || "0";
        
        //     console.log('Subtotal:', subtotal);
        //     console.log('Discount:', discount);
        //     console.log('Grand Total:', grandTotal);
        
        //     SalesforceInteractions.sendEvent({
        //         interaction: {
        //             name: "Payment Method",
        //             eventType: "payment",
        //             attributes: {
        //                 PaymentMethod: methodName,
        //                 SubTotal: parseFloat(subtotal),
        //                 Discount: parseFloat(discount),
        //                 GrandTotal: parseFloat(grandTotal)
        //             }
        //         }
        //     });
        // }
        
        // // Set up the observer
        // const observerpm = new MutationObserver((mutationsList) => {
        //     if (window.location.href === "https://student.devinfinitylearn.in/subscription/mycart") {
        //         const emiButtons = document.querySelectorAll('.subscrp-emi-bank-name-box');
        //         const emimethods = document.querySelectorAll(".subscrp-blue-brdbox-hdr");
        
        //         const headerTexts = Array.from(emimethods).map((method) => method.innerText.trim());
        
        //         const isValidMethod = headerTexts.some(text =>
        //             ["Cardless EMI", "No Cost EMI", "Debit Card EMI", "Credit Card EMI"].includes(text)
        //         );
        
        //         if (isValidMethod) {
        //             emiButtons.forEach((btn) => {
        //                 if (!btn.hasAttribute('data-listener-attached')) {
        //                     btn.addEventListener('click', handlePaymentClick);
        //                     btn.setAttribute('data-listener-attached', 'true');
        //                     console.log("Event listener attached to EMI button");
        //                 }
        //             });
        //         }
        //     }
        // });
        
        // // Wait for DOM ready before observing
        // document.addEventListener('DOMContentLoaded', () => {
        //     observerpm.observe(document.body, { childList: true, subtree: true });
        // });
        

      


        // observerpm.observe(document.body, {
        //     childList: true,
        //     subtree: true
        // });



        function handlePaymentClick(event) {
            const clickedBox = event.currentTarget;
            const blueBox = clickedBox.closest('.subscrp-blue-brdbox');
            const methodTitle = blueBox?.querySelector('.subscrp-blue-hdng');
            const methodName = methodTitle?.innerText.trim() || '';
        
            console.log('Payment Method:', methodName);
        
            // Extract prices
            const items = document.querySelectorAll('.SUBCRP-cart-review-list li');
        
            let subtotalElement1, discountElement1, grandTotalElement1;
        
            items.forEach((item) => {
                const label = item.querySelector('span')?.innerText?.trim();
        
                if (label === 'Subtotal') {
                    subtotalElement1 = item.querySelector('.review-bold-text');
                } else if (label?.includes('Discount')) {
                    discountElement1 = item.querySelector('.review-bold-text');
                } else if (label === 'Grand Total') {
                    grandTotalElement1 = item.querySelector('div.review-bold-text, div.review-blue-txt.review-bold-text');
                }
            });
        
            const subtotal = subtotalElement1?.innerText.replace(/[^\d.]/g, '') || "0";
            const discount = discountElement1?.innerText.replace(/[^\d.]/g, '') || "0";
            const grandTotal = grandTotalElement1?.innerText.replace(/[^\d.]/g, '') || "0";
        
            console.log('Subtotal:', subtotal);
            console.log('Discount:', discount);
            console.log('Grand Total:', grandTotal);
        
            SalesforceInteractions.sendEvent({
                interaction: {
                    name: "Payment Method",
                    eventType: "payment",
                    attributes: {
                        PaymentMethod: methodName,
                        SubTotal: parseFloat(subtotal),
                        Discount: parseFloat(discount),
                        GrandTotal: parseFloat(grandTotal)
                    }
                }
            });
        }
        
        // Set up the observer
        const observerpm = new MutationObserver((mutationsList) => {
            if (window.location.href === "https://student.devinfinitylearn.in/subscription/mycart") {
                const emiButtons = document.querySelectorAll('.subscrp-emi-bank-name-box');
                const emimethods = document.querySelectorAll(".subscrp-blue-brdbox-hdr");
        
                const headerTexts = Array.from(emimethods).map((method) => method.innerText.trim());
        
                const isValidMethod = headerTexts.some(text =>
                    ["Cardless EMI", "No Cost EMI", "Debit Card EMI", "Credit Card EMI"].includes(text)
                );
        
                if (isValidMethod) {
                    emiButtons.forEach((btn) => {
                        if (!btn.hasAttribute('data-listener-attached')) {
                            btn.addEventListener('click', handlePaymentClick);
                            btn.setAttribute('data-listener-attached', 'true');
                            console.log("Event listener attached to EMI button");
                        }
                    });
                }
            }
        });
        
        // Start observing immediately
        observerpm.observe(document.body, { childList: true, subtree: true });
        
        
        
        function firstpage() {


            console.log("im in first page function");
            const form = document.querySelector(".heroSection_predictform__SbVho form");

            if (!form) {
                console.error("Form not found on the first page.");
                return;
            }

            console.log("firstpage() function triggered!");

            let formData = new FormData(form);
            let data = {};

            formData.forEach((value, key) => {
                data[key] = value;
            });

            const namee = data.name || null;
            const emaill = data.email || null;
            const mobilenumber = data.phone || null;
            const selectedGrade = data.grade || null;
            const activeOption = document.querySelector('.heroSection_optionname_active__4mEMT')?.textContent.trim() || null;

            if (mobilenumber) {
                console.log("Capturing Mobile Number:", mobilenumber);
                SalesforceInteractions.sendEvent({
                    interaction: { name: 'Registration Form' },
                    user: { attributes: { phoneNumber: mobilenumber, eventType: 'contactPointPhone' } }
                });
            }

            if (namee) {
                console.log("Capturing Name:", namee);
                SalesforceInteractions.sendEvent({
                    interaction: { name: 'Registration Form' },
                    user: { attributes: { firstName: namee, eventType: 'identity', isAnonymous: '0' } }
                });
            }

            if (emaill) {
                console.log("Capturing Email:", emaill);
                SalesforceInteractions.sendEvent({
                    interaction: { name: 'Registration Form' },
                    user: { attributes: { email: emaill, eventType: 'contactPointEmail' } }
                });
            }

            if (selectedGrade || activeOption) {
                console.log("Capturing Grade & Option:", selectedGrade, activeOption);
                SalesforceInteractions.sendEvent({
                    interaction: {
                        name: 'Registration Form',
                        eventType: 'CustomEvent',
                        attributes: {
                            Grade: selectedGrade || null,
                            ActiveOption: activeOption || null
                        }
                    }
                });
            }

            console.log("Data sent successfully!");
        }

        function secondpage() {
            console.log("im in second page function");
            const selectElement = document.querySelector('.heroSection_UNFAPP_form_fld__Rzhv5[name="timeSlot"]');
            const schoolInput = document.querySelector('.heroSection_UNFAPP_form_fld__Rzhv5[name="schoolName"]');

            if (!selectElement || !schoolInput) {
                console.error("Required fields missing on the second page.");
                return;
            }

            console.log("secondpage() function triggered!");

            const selectedTimeSlot = selectElement.options[selectElement.selectedIndex]?.text || "";
            const schoolName = schoolInput.value || "";

            console.log("Selected Time Slot:", selectedTimeSlot);
            console.log("School Name:", schoolName);

            SalesforceInteractions.sendEvent({
                interaction: {
                    name: 'Registration form',
                    eventType: 'CustomEvent',
                    attributes: {
                        TimeSlot: selectedTimeSlot,
                        SchoolName: schoolName
                    }
                }
            });

            console.log("Data sent successfully from second page!");
        }

        function thirdpage() {

            console.log("im in third page function");

            const state = document.querySelector('select[name="state"]')?.value || null;
            const district = document.querySelector('select[name="district"]')?.value || null;
            const city = document.querySelector('select[name="city"]')?.value || null;
            const pinCode = document.querySelector('input[name="pinCode"]')?.value.trim() || null;

            console.log("State:", state);
            console.log("District:", district);
            console.log("City:", city);
            console.log("Pin Code:", pinCode);

            SalesforceInteractions.sendEvent({
                interaction: {
                    name: "Registration Form",
                },
                user: {
                    attributes: {
                        stateProvince: state,
                        city: city,
                        district: district,
                        postalCode: pinCode,
                        eventType: 'identity',
                        isAnonymous: '0',

                    },
                }
            });



        }


        // Observer for First Page
        const firstPageObserver = new MutationObserver(() => {
            const isFirstPage =
                document.querySelector("h4.heroSection_prdform_title__PKnfM")?.textContent.trim() === "Registration form" &&
                document.querySelector('input[name="name"]') !== null;

            if (isFirstPage) {
                console.log("First page detected!");
                const button = document.querySelector(".heroSection_prdrankbtn__pWFpU");
                if (button) {
                    button.addEventListener("click", firstpage);
                }
                // Stop observing once the first page is detected
                firstPageObserver.disconnect();
            }
        });

        // Observer for Second Page
        const secondPageObserver = new MutationObserver(() => {
            const isSecondPage = document.querySelector('select[name="timeSlot"]') !== null;

            if (isSecondPage) {
                console.log("Second page detected!");
                const button = document.querySelector(".heroSection_prdrankbtn__pWFpU");
                if (button) {
                    button.addEventListener("click", secondpage);
                }
                // Stop observing once the second page is detected
                secondPageObserver.disconnect();
            }
        });

        // Observer for Second Page
        const thirdPageObserver = new MutationObserver(() => {
            const isthirdPage = document.querySelector('select[name="state"]') !== null;

            if (isthirdPage) {
                console.log("Third page detected!");
                const button = document.querySelector(".heroSection_prdrankbtn__pWFpU");
                if (button) {
                    button.addEventListener("click", thirdpage);
                }
                // Stop observing once the second page is detected
                thirdPageObserver.disconnect();
            }
        });

        // Start Observing
        firstPageObserver.observe(document.body, { childList: true, subtree: true });
        secondPageObserver.observe(document.body, { childList: true, subtree: true });
        thirdPageObserver.observe(document.body, { childList: true, subtree: true });

        const {
            cashDom,
            listener,
            resolvers,
            sendEvent,
            util,
            CatalogObjectInteractionName,
        } = SalesforceInteractions



        const global = {
            listeners: [

                //resend otp


                listener("click", ".resendText", (event) => {
                    console.log("Resend OTP Clicked");
                
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Resend OTP',
                            eventType: 'buttonClick',
                        }
                    });
                }),

                //navbar 
                listener("click", ".UNFAPP-newwdashbrd-lftnav-area", (event) => {
                    // Find the closest anchor tag from the click target
                    const anchor = event.target.closest("a");

                    // Make sure the click happened on a sidebar link
                    if (!anchor || !event.currentTarget.contains(anchor)) return;

                    // Extract the label (menu text like Home, Learn, etc.)
                    const label = anchor.querySelector("span")?.textContent?.trim();

                    if (label) {
                        console.log("Menu Clicked:", label);

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Side NavBar',
                                eventType: 'icon',
                                attributesLabel: label

                            }
                        });


                    }
                }),



                //profile
                listener("click", ".dropdown-toggle", (event) => {
                    console.log("Profile icon clicked");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Profile Icon',
                            eventType: 'icon',
                            attributes: {
                            }
                        }
                    });
                }),



                //logo click


                listener("click", ".headerlogo", (event) => {
                    console.log("Logo clicked");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Infinity Logo Click',
                            eventType: 'icon',
                            attributes: {
                            }
                        }
                    });
                }),


                // login with otp


                listener("click", ".continueBtn.ng-star-inserted", (event) => {
                    console.log("Entered login event");
                    // event.stopImmediatePropagation();
                    // Fetch and trim phone number and country code
                    let phoneNumber = document.querySelector("#phone").value.trim();
                    console.log("Phone Number:", phoneNumber);

                    let countryCode = document.querySelector("#country-code").value.trim();
                    console.log("Country Code:", countryCode);

                    // Country code mapping
                    let countryCodeMap = {
                        "91": "IN",
                        "971": "AE"
                    };

                    // Extract country abbreviation using the map
                    let country = countryCodeMap[countryCode] || "";
                    console.log("Country:", country);

                    // Combine country code and phone number (without + and space)
                    let mobilenumber_code = `${countryCode}${phoneNumber}`;
                    console.log("Full Mobile Number:", mobilenumber_code);

                    // Send event to Salesforce
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Login",
                        },
                        user: {
                            attributes: {
                                phoneNumber: mobilenumber_code,  // Example: 919876543210
                                eventType: 'contactPointPhone',
                                sourceLocale: country,  // Example: IN
                            },
                        },
                    });
                }),

                //login with password


                // listener("click", ".continueBtn", (event) => {
                //     console.log("Entered login with password");
                //     event.preventDefault(); 

                //     let phoneNumber = document.querySelector("#phone").value.trim();
                //     console.log("Phone Number:", phoneNumber);

                //     let countryCode = document.querySelector("#country-code").value.trim();
                //     console.log("Country Code:", countryCode);

                //     // Country code mapping
                //     let countryCodeMap = {
                //         "91": "IN",
                //         "971": "AE"
                //     };

                //     // Extract country abbreviation using the map
                //     let country = countryCodeMap[countryCode] || "";
                //     console.log("Country:", country);

                //     // Combine country code and phone number (without + and space)
                //     let mobilenumber_code = `${countryCode}${phoneNumber}`;
                //     console.log("Full Mobile Number:", mobilenumber_code);

                //     // Send event to Salesforce
                //     SalesforceInteractions.sendEvent({
                //         interaction: {
                //             name: "Login With Password",
                //         },
                //         user: {
                //             attributes: {
                //                 phoneNumber: mobilenumber_code,  // Example: 919876543210
                //                 eventType: 'loginWithPassword',
                //                 sourceLocale: country,  // Example: IN
                //             },
                //         },
                //     });
                // }),


                //forgot password



                listener("click", ".forgetPassword", (event) => {
                    console.log("in forgot password");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Forgot password',
                            eventType: 'forgot',
                            attributes: {
                            },
                        },
                    });
                }),

                //logout

                listener("click", ".dropdown-item", (event) => {
                    console.log("in log out");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Log out',
                            eventType: 'logout',
                            attributes: {
                            },
                        },
                    });
                }),


                //view solution due to angular issue writing here


                // listener("click", ".btn.UNFAPP-asmnt-blue-hdrbtn.ng-star-inserted", (event) => {
                //     console.log("In view test report page");


                //        // const examContainer = document.querySelector("h3.UNFAPP-hdng.UNFAPP-main-hdng");
                //         const examName =  sessionStorage.getItem("ExamName") || "Unknown Test";

                //         console.log("Captured Exam Name:", examName);

                //         SalesforceInteractions.sendEvent({
                //             interaction: {
                //                 name: 'View Solutions',
                //                 eventType: 'CustomEvent',
                //                 attributes: {
                //                     ExamName: examName,
                //                 },
                //             },
                //         });

                // }),


                listener("click", ".heroSection_prdrankbtn__oLW5s", (event) => {
                    console.log("Predict rank button clicked");

                    // Capture form inputs
                    const scoreInput = document.querySelector('input[name="score"]');
                    const nameInput = document.querySelector('input[name="name"]');
                    const phoneInput = document.querySelector('input[name="phone"]');
                    const stateSelect = document.querySelector('select[name="state"]');
                    const genderInputs = document.querySelectorAll('input[name="gender"]');

                    const score = scoreInput ? scoreInput.value.trim() : null;
                    const name = nameInput ? nameInput.value.trim() : null;
                    const phoneNumber = phoneInput ? phoneInput.value.trim() : null;
                    const state = stateSelect ? stateSelect.value.trim() : null;
                    const gender = Array.from(genderInputs).find(input => input.checked)?.value;

                    console.log("Captured Details:", {
                        score: score,
                        name: name,
                        phoneNumber: phoneNumber,
                        state: state,
                        gender: gender,
                    });


                    // Send form data to Salesforce when "Predict My Rank" button is clicked
                    if (score && state) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Rank Predictor',
                                eventType: 'CustomEvent',
                                attributes: {
                                    Score: score,
                                    Gender: gender || 'Not Provided',
                                },
                            },
                        });

                    }


                    if (name) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Rank Predictor',
                            },
                            user: {
                                attributes: {
                                    firstName: name,
                                    stateProvince: state,
                                    eventType: 'identity',
                                    isAnonymous: '0',
                                },
                            },
                        });
                    }


                    if (phoneNumber) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Rank Predictor',
                            },

                            user: {
                                attributes: {
                                    phoneNumber: phoneNumber,
                                    eventType: 'contactPointPhone',
                                },
                            },
                        });
                    }
                }),



                // listener("click", ".UNFAPP-asmnt-upcmn-link.attmp-btn.UNFAPP-gpbtn-cyot.Attempt.now.ng-star-inserted", (event) => {


                //     console.log("Attempt Now button clicked!");

                //     // // Select the "Attempt now" button using its class
                //     // let attemptNowText = document.querySelectorAll(".attmp-btn")?.innerText.trim() || "No Button Found";

                //     // // Log the result
                //     // console.log("Button Text:", attemptNowText);

                //     let xpath = "//button[contains(text(), 'Attempt now')]";
                //     let buttons = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                //     for (let i = 0; i < buttons.snapshotLength; i++) {
                //         let buttonText = buttons.snapshotItem(i).innerText.trim()
                //         console.log("Button Text:", buttonText);
                //     }


                //     if (buttonText == "ATTEMPT NOW") {

                //         // Capture the test name

                //         const parentBlockk = event.currentTarget.closest(".UNFAPP-asmnt-tpcbox"); // Get the closest parent block
                //         const stuexamElementt = parentBlockk?.querySelector(".h3-asmnt-upcmng-hdng"); // Find the exam name inside it
                //         const stuexamNamee = stuexamElementt ? stuexamElementt.textContent.trim() : null;





                //         // Check and log the captured values
                //         if (stuexamNamee) {

                //             console.log("Exam Name:", stuexamNamee);

                //             // Send captured values to SalesforceInteractions
                //             SalesforceInteractions.sendEvent({
                //                 interaction: {
                //                     name: 'Attempt button click',
                //                     eventType: 'CustomEvent',
                //                     attributes: {
                //                         interactionName: "Attempt Button Clicked",
                //                         StudentExamName: stuexamNamee,
                //                     },
                //                 },
                //             });
                //         }
                //     }
                // }),


                listener("click", ".UNFAPP-asmnt-upcmn-link.attmp-btn.UNFAPP-gpbtn-cyot", (event) => {
                    console.log("Attempt Now button clicked!");

                    // Capture the button text
                    let buttonText = event.currentTarget.innerText.trim();
                    console.log("Button Text:", buttonText);

                    if (buttonText.toUpperCase() === "ATTEMPT NOW") {
                        // Capture the test name
                        const parentBlock = event.currentTarget.closest(".UNFAPP-asmnt-tpcbox"); // Find the closest test block
                        const examElement = parentBlock?.querySelector(".h3-asmnt-upcmng-hdng"); // Find the exam name element
                        const examName = examElement ? examElement.textContent.trim() : null;

                        // Check and log the captured values
                        if (examName) {
                            console.log("Exam Name:", examName);

                            // Send captured values to SalesforceInteractions
                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Attempt button click',
                                    eventType: 'CustomEvent',
                                    attributes: {
                                        interactionName: "Attempt Button Clicked",
                                        StudentExamName: examName,
                                    },
                                },
                            });
                        }
                    }
                }),



                listener("click", ".UNFAPP-blue-btn", (event) => {
                    console.log("Submit Button clicked!");

                    // Fetch the form details container
                    let formDetails = document.querySelector(".UNFAPP-cntct-mnbox");

                    // Fetch individual form fields
                    let firstNameField = formDetails.querySelector("input[formcontrolname='firstName']");
                    let lastNameField = formDetails.querySelector("input[formcontrolname='lastName']");
                    let phoneNumberField = formDetails.querySelector("input[formcontrolname='phone']");
                    let reasonField = formDetails.querySelector("select[formcontrolname='reason']");

                    // Get the values of the fields
                    let firstName = firstNameField ? firstNameField.value : "";
                    let lastName = lastNameField ? lastNameField.value : "";
                    let phoneNumber = phoneNumberField ? phoneNumberField.value : "";

                    // Get the text of the selected reason
                    let reason = reasonField ? reasonField.options[reasonField.selectedIndex].text : "";

                    // Log field values for debugging
                    console.log(
                        `First Name: ${firstName}, Last Name: ${lastName}, Phone Number: ${phoneNumber}, Reason: ${reason}`
                    );

                    // Send the interaction event to Salesforce with identity details
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Contact Us Button",
                            eventType: "CustomEvent",
                            attributes: {
                                interactionName: "Contact Us Button Clicked",
                                firstName: firstName,
                                lastName: lastName,
                                reason: reason,
                                eventType: "identity",
                                isAnonymous: "0"
                            }
                        }
                    });

                    // Send the interaction event to Salesforce with contact details
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Contact Us",
                            attributes: {
                                phoneNumber: phoneNumber,
                                eventType: "contactPointPhone"
                            }
                        }
                    });
                }),

                //exam focus
                listener("click", ".UNFAPP-modal-blubtn", (event) => {
                    console.log("Confirm Button clicked!");

                    // Fetch the list of exam options
                    let examList = document.querySelectorAll(".UNFAPP-examlst input[type='radio']");

                    // Initialize variable for the selected course name
                    let selectedCourseName = "";

                    // Loop through the radio buttons to find the checked one
                    examList.forEach((radioButton) => {
                        if (radioButton.checked) {
                            // Get the course name from the associated label
                            let labelInfo = radioButton.closest(".UNFAPP-examlabel").querySelector(".UNFAPP-examlabel-hdng");
                            selectedCourseName = labelInfo ? labelInfo.textContent.trim() : "";
                        }
                    });

                    // Log the selected course name for debugging
                    console.log(`Selected Course Name: ${selectedCourseName}`);

                    // Send the interaction event to Salesforce
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Focus Exam",
                            eventType: "CustomEvent",
                            attributes: {
                                CourseType: selectedCourseName,
                            },
                        },
                    });
                }),


                listener("click", ".btn.btn-blue-solid", (event) => {
                    console.log("Save Button clicked!");

                    let courseCheckboxes = document.querySelectorAll(".UNFAPP-examlst input[type='checkbox']");

                    let selectedCourses = [];

                    courseCheckboxes.forEach((checkbox) => {
                        if (checkbox.checked) {
                            let courseNameElement = checkbox.closest(".UNFAPP-examlabel").querySelector(".UNFAPP-examlabel-hdng");
                            let courseName = courseNameElement ? courseNameElement.textContent?.trim() : "";
                            if (courseName) {
                                selectedCourses.push(courseName);
                            }

                        }
                    });

                    let coursetype1 = selectedCourses.join(", ");

                    console.log(`selected courses:'${coursetype1}`);

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Edit Target Exam",
                            eventType: "CustomEvent",
                            attributes: {
                                CourseType: coursetype1,
                            }
                        }
                    });

                }),



            ]
        }

        document.addEventListener("click", function (event) {
            if (event.target.closest(".btn.UNFAPP-blue-btn.btn-block.ng-star-inserted")) {
                console.log("Watch Now button clicked");

                // Get the parent container of the clicked button
                const classContainer = event.target.closest(".UNFAPP-free-lvcls-cnt-area");

                if (classContainer) {
                    const subjectName = classContainer.querySelector(".UNFAPP-subjct-title")?.innerText.trim();
                    const teacherName = classContainer.querySelector(".UNFAPP-subjct-subtitle")?.innerText.trim();
                    const classDateText = classContainer.querySelector(".UNFAPP-free-lvcls-time-row li:first-child span")?.innerText.trim(); // e.g., "20 Jun, 2024"
                    const classTimeText = classContainer.querySelector(".UNFAPP-free-lvcls-time-row li:nth-child(2) span")?.innerText.trim(); // e.g., "5:40 pm - 6:40 pm"

                    // Convert date & time to ISO 8601 format
                    let classDateTimeISO = null;
                    if (classDateText && classTimeText) {
                        try {
                            const [day, rawmonthAbbr, year] = classDateText.split(" ");
                            const monthAbbr = rawmonthAbbr.replace(",", "").trim();
                            const months = {
                                "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                                "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                                "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
                            };

                            const month = months[monthAbbr]; // Convert month abbreviation to number
                            const startTime = classTimeText.split(" - ")[0]; // Get start time (e.g., "5:40 pm")

                            // Convert time to 24-hour format
                            const timeParts = startTime.match(/(\d+):(\d+) (\w{2})/);
                            if (timeParts) {
                                let hours = parseInt(timeParts[1], 10);
                                const minutes = timeParts[2];
                                const ampm = timeParts[3].toLowerCase();

                                if (ampm === "pm" && hours !== 12) {
                                    hours += 12;
                                } else if (ampm === "am" && hours === 12) {
                                    hours = 0;
                                }

                                const formattedHours = hours.toString().padStart(2, "0"); // Ensure 2-digit format
                                const formattedDate = `${year}-${month}-${day}T${formattedHours}:${minutes}:00Z`; // ISO 8601 format

                                classDateTimeISO = formattedDate;
                            }
                        } catch (error) {
                            console.error("Date parsing error:", error);
                        }
                    }

                    console.log("ISO 8601 Date:", classDateTimeISO);

                    // Send event to Salesforce
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Watch Now",
                            eventType: "CustomEvent",
                            attributes: {
                                Teacher: teacherName,
                                Subject: subjectName,
                                ClassDate: classDateTimeISO
                            }
                        }
                    });
                }
            }
        });


        const ReportPage = {
            name: 'ReportPage',
            isMatch: () => /\/testlist/.test(window.location.href),

            listeners: [
                listener("click", ".UNFAPP-asmnt-upcmn-link.attmp-btn.UNFAPP-gpbtn-cyot.ng-star-inserted", (event) => {
                    console.log("View Report got clicked!");
                    const nameElement = document.querySelector('.h3-asmnt-upcmng-hdng');
                    const examNamee = nameElement ? nameElement.textContent.trim() : 'Not Found';
                    console.log("examNamee", examNamee);
                    console.log("Title:", examNamee);

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'View Report',
                            eventType: 'CustomEvent',
                            attributes: {
                                StudentExamName: examNamee,
                            },
                        },
                    });
                }),


            ]
        };


        //viewreport solutions button click

        const ViewReportPage = {
            name: 'ViewReportPage',
            isMatch: () => /\/viewtestreport/.test(window.location.href),

            onEnter: () => {
                console.log("Entered ViewReportPage");

                // Wait briefly and store exam name after DOM updates
                setTimeout(storeExamNameOnPageLoad, 500);
            },

            listeners: [
                listener("click", ".btn.UNFAPP-asmnt-blue-hdrbtn.ng-star-inserted", () => {
                    console.log(" Clicked View Solutions");

                    const storedExamName = sessionStorage.getItem("examName") || "Unknown Exam";
                    console.log(" Retrieved exam name:", storedExamName);

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'View Solutions',
                            eventType: 'CustomEvent',
                            attributes: {
                                ExamName: storedExamName,
                            },
                        },
                    });
                }),
            ],
        };

        function storeExamNameOnPageLoad() {
            const examElement = document.querySelector("h3.UNFAPP-hdng.UNFAPP-main-hdng");
            if (examElement) {
                const examName = examElement.textContent.trim();
                console.log("Stored exam name on page load:", examName);
                sessionStorage.setItem("examName", examName);
            } else {
                console.warn(" Exam name not found on page load.");
            }
        }




        const homepage = {
            name: 'homepage',
            isMatch: () => window.location.href === 'https://ilwebsite2.devinfinitylearn.in/',
            listeners: [
                listener("click", ".otp_button", (event) => {
                    console.log("verify otp button clicked");
                    console.log("done");

                    // Delay execution for 2 seconds (2000 milliseconds)
                    setTimeout(() => {

                        const crnIdElement = document.querySelector(".Learn_crn_id");
                        const crnId = crnIdElement ? crnIdElement.textContent.trim() : "N/A";

                        // Capture UAM ID
                        const uamIdElement = document.querySelector(".Learn_uam_id");
                        const uamId = uamIdElement ? uamIdElement.textContent.trim() : "N/A";

                        console.log("Captured CRN ID:", crnId);
                        console.log("Captured UAM ID:", uamId);

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Capture ID's",
                            },
                            user: {
                                attributes: {
                                    LearnCrnId: crnId,
                                    LearnUamId: uamId,
                                    eventType: 'identity',
                                    isAnonymous: 1
                                },
                            },
                        });

                        console.log("Salesforce event fired after delay");
                    }, 2000);
                }),


                listener("click", ".heroSection_numbtn_txt__dV4KS", (event) => {
                    // console.log("Homepage join free clicked");
                    // const mobileInput = document.querySelector(".heroSection_typemobile__KSsA6"); 
                    // const mobilenumber = mobileInput ? mobileInput.value : null; 
                    // console.log("mobilenumber:", mobilenumber);

                    const parentDiv = event.currentTarget.closest(".heroSection_typemobilefield__kw8vX");
                    const mobileInput = parentDiv ? parentDiv.querySelector(".heroSection_typemobile__KSsA6") : null;

                    // const countryCodeElement = document.querySelector(".heroSection_coun__code__cP06f");

                    // const countryCode = countryCodeElement ? countryCodeElement.innerText.trim() : "+91";
                    const mobileNumber = mobileInput ? mobileInput.value.trim() : null;
                    // const fullNumber = mobileNumber ? `${countryCode} ${mobileNumber}` : null;

                    console.log("Captured Mobile Number:", mobileNumber);

                    if (!mobileInput) {
                        console.log("Mobile input field not found!");
                    }

                   

                    if (mobileNumber) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'join for free'
                            },
                            user: {
                                attributes: {
                                    phoneNumber: mobileNumber,
                                    eventType: 'contactPointPhone'

                                }
                            }
                        })
                    }
                }),


                listener("click", ".selectLearningGoal_tui_multisubcard__mEj1e", (event) => {
                    console.log("Course card clicked");

                    // Capture the course name
                    const courseElement = event.currentTarget.querySelector(".selectLearningGoal_tuitab_hd__7VKDI");
                    const courseName = courseElement ? courseElement.textContent.trim() : null;

                    console.log("Selected Course Name:", courseName);

                    if (courseName) {
                        // Store the course in session storage
                        sessionStorage.setItem('selectedCourse', courseName);
                    }
                }),

                listener("click", ".slt_grbtn", (event) => {
                    console.log("Class button clicked");

                    // Capture the selected class
                    const selectedClass = event.target.textContent.trim();
                    console.log("Selected Class:", selectedClass);

                    // Retrieve the stored course name
                    const storedCourseName = sessionStorage.getItem('selectedCourse');
                    console.log("Stored Course Name:", storedCourseName);

                    if (storedCourseName && selectedClass) {
                        // Send both course and class to Salesforce
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Competitive Exam Selection',
                                eventType: 'CustomEvent',
                                attributes: {
                                    CourseType: storedCourseName,
                                    Grade: selectedClass,
                                },
                            },
                        });
                        console.log("Course and class data sent to Salesforce.");
                    } else {
                        console.log("Course or class data is missing!");
                    }
                }),

                listener("click", "#phone_icon", (event) => {
                    console.log("Phone icon clicked");

                    // Send event to Salesforce with additional information
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Phone Icon",
                            eventType: 'icon',
                            attributes: {
                                ContactedChannel: "Phone"
                            }
                        }
                    });
                }),


                listener("click", ".styles_callIconTab__GLq7R", (event) => {
                    console.log("Phone icon clicked");

                    // Send event to Salesforce with additional information
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Phone Icon",  //icon click
                            eventType: 'icon',
                            attributes: {
                                ContactedChannel: "Phone"
                            }
                        }
                    });
                }),

                listener("click", "#whatsapp", (event) => {
                    console.log("WhatsApp icon clicked");

                    // Send event to Salesforce with additional information
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "whatsapp Icon",  //icon click
                            eventType: 'icon',
                            attributes: {
                                ContactedChannel: "WhatsApp"
                            }
                        }
                    });
                }),

                listener("click", ".form_prdrankbtn__Jdc8S", (event) => {
                    console.log("Booking counselling session");

                    const nameInput = document.querySelector('input[name="name"]');
                    const gradeSelect = document.querySelector('select[name="grade"]');
                    const phoneInput = document.querySelector('input[type="tel"]');
                    const foundationButtons = document.querySelectorAll('.form_optionname__raVe0.form_optionname_active__t1tAV');


                    const name = nameInput ? nameInput.value.trim() : null;
                    const foundation = foundationButtons.length > 0 ? foundationButtons[0].textContent.trim() : null;
                    const grade = gradeSelect ? gradeSelect.value.trim() : null;
                    const phoneNumber = phoneInput ? phoneInput.value.trim() : null;

                    console.log("Captured Details:", {
                        name: name,
                        grade: grade,
                        phoneNumber: phoneNumber,
                        foundation: foundation,
                    });

                    // Send form data to Salesforce when "Book Now" button is clicked
                    if (grade) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'BookCounsellingSession',
                                eventType: 'CustomEvent',
                                attributes: {
                                    Grade: grade || null,
                                    Foundation: foundation || null,
                                },
                            },
                        });
                    }

                    if (name) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'CounsellingSession Name Captured',
                            },
                            user: {
                                attributes: {
                                    firstName: name,
                                    eventType: 'identity',
                                    isAnonymous: '0',
                                },
                            },
                        });
                    }

                    if (phoneNumber) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Phone Captured for CounsellingSession',
                            },
                            user: {
                                attributes: {
                                    phoneNumber: phoneNumber,
                                    eventType: 'contactPointPhone',
                                },
                            },
                        });
                    }


                    console.log("Form data sent to Salesforce");
                }),


                listener("click", ".styles_courseSubListCard__rA6Bd", (event) => {
                    // Capture the course name within the clicked card
                    const courseNameElement = event.currentTarget.querySelector(".styles_courseSubListText1__Jh6IG");
                    const courseName = courseNameElement ? courseNameElement.textContent.trim() : null;

                    if (courseName) {
                        console.log("Selected Course:", courseName);

                        // Store the course name in sessionStorage
                        sessionStorage.setItem("selectedCourse", courseName);
                        console.log("the course stored in the sessionstorage");

                        // Optional: Log the sessionStorage value for confirmation

                    } else {
                        console.log("Course name could not be found.");
                    }
                }),

            ]
        }






        const StudentPage = {
            name: 'StudentDashboardPage',
            isMatch: () => /\/dashboard/.test(window.location.href),

            listeners: [

                listener("click", ".button-overlay", (event) => {
                    console.log("Block clicked!");

                    // Find the closest parent with class 'UNFAPP-asmnt-testbx'
                    const testContainer = event.target.closest(".UNFAPP-asmnt-testbx");

                    if (!testContainer) {
                        console.log("Test container not found.");
                        return;
                    }

                    // Extract test name
                    const testTitleElement = testContainer.querySelector(".h2-testbx-hdng.UFAPP-Tsts-textalgn");
                    const stuexamName = testTitleElement ? testTitleElement.innerText.trim() : null;

                    if (stuexamName) {
                        console.log("Exam Name:", stuexamName);

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Test Selected",
                                eventType: "CustomEvent",
                                attributes: {
                                    interactionName: "Test Selected",
                                    TestName: stuexamName,
                                },
                            },
                        });
                    } else {
                        console.log("Exam name could not be found.");
                    }
                }),


                //live class enroll now

                listener("click", ".btn.btn-info._mb-sm-2.mr-2.enroll-btn.m-font-14", (event) => {
                    console.log("Enroll button clicked!");

                    // Find the nearest course container
                    const courseContainer = event.target.closest(".UNFAPP-lvcls-curses-box");
                    if (!courseContainer) {
                        console.warn("Course container not found!");
                        return;
                    }

                    // Extract course details
                    const courseName = courseContainer.querySelector(".lvcls-mobhdng")?.innerText.trim() || "Unknown Course";
                    const grade = courseContainer.querySelector(".UNFAPP-lvcls-grdtm-lst-area li:nth-child(1) span")?.innerText.trim() || "Unknown Grade";
                    const duration = courseContainer.querySelector(".UNFAPP-lvcls-grdtm-lst-area li:nth-child(2) span")?.innerText.trim() || "Unknown Duration";
                    const language = courseContainer.querySelector(".grd-cls-nm")?.innerText.trim() || "Unknown Language";

                    console.log("Captured Live Class Data:", {
                        courseName,
                        grade,
                        duration,
                        language,
                    });

                    console.log(parseFloat(duration));

                    // Send captured data to SalesforceInteractions
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Live Class Enrollment",
                            eventType: "CustomEvent",
                            attributes: {
                                CourseType: courseName,
                                Grade1: grade,
                                Duration: duration,
                                Language: language,
                            },
                        },
                    });
                }),


                //live classes


                listener("click", ".btn.btn-info._mb-sm-2.mr-2.UNFAPP-lvmtrcls-jnbtn.rewatch", (event) => {
                    console.log("Watch Now button clicked!");

                    const card = event.currentTarget.closest(".UNFAPP-lvcls-mob-rw-scrll.UNFAPP-enroll-wrp-inergap");

                    if (!card) {
                        console.log("Class card not found!");
                        return;
                    }

                    // Extracting class details
                    const subject = card.querySelector(".UNFAPP-mstr-subjct span")?.innerText.trim() || null;
                    const className = card.querySelector(".UNFAPP-lvmtrcls-title")?.innerText.trim() || null;
                    const teacher = card.querySelector(".UNFAPP-lvmtrcls-subtitle")?.innerText.replace("By", "").trim() || null;


                    console.log(subject)
                    console.log(className)
                    // Sending event to capture class data
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Completed Master Classes',
                            eventType: 'CustomEvent',
                            attributes: {
                                subject: subjectName,
                                teacher: teacherName,
                            },
                        }
                    });

                    // Log the captured data for debugging
                    console.log(`Captured Class Data:`, {
                        subject,
                        className,
                        teacher,
                    });
                }),


                listener("click", ".btn.btn-primary.ng-star-inserted", (event) => {
                    console.log("Begin test got clicked!");
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Begin Test',
                            eventType: 'CustomEvent',
                            attributes: {
                                interactionName: "Student Begin Test",
                                BeginTest: "Yes",
                            },
                        },
                    });
                }),



                listener("click", ".btn-link.UNFAPP-blue-txt-link.assessment_mb-0", (event) => {
                    console.log("Finish test got clicked!");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Finish Test',
                            eventType: 'CustomEvent',
                            attributes: {
                                interactionName: "Student Finish Test",
                                BeginTest: "Yes",
                            },
                        },
                    });

                }),

                listener("click", ".CYOT-CYOT-testbtn", (event) => {
                    console.log("create a new test button clicked!");

                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: 'Create new Test',
                            eventType: 'CustomEvent',
                            attributes: {
                                interactionName: "Create new Test",
                            },
                        },
                    });

                }),


            ],


        };






        const RegistrationSuccessful123 = {
            name: 'RegistrationSuccessful',
            isMatch: () => window.location.href === 'https://ilwebsite2.devinfinitylearn.in/score/thankyou',
            interaction: {
                name: 'Registration Successful',
                eventType: 'CustomEvent',
                attributes: {
                    interactionName: 'Registration Successful',
                },
            },
        };



        let selectedPaymentMethod = "UPI"; // Default selection when landing on the page

        // let count = 1;
        const Subscription = {
            name: 'subscription',
            isMatch: () => /\/subscription/.test(window.location.href),
            listeners: [

                //Subscriptions (Buy Now)
                listener("click", ".SUBCRP-blue-btn.full", (event) => {
                    console.log("In the buy now listener");

                    // Find the closest package container
                    //const packageContainer = event.target.closest(".SUBCRP-list-box");
                    const packageContainer = document.querySelector(".SUBCRP-list-box");


                    if (packageContainer) {
                        // Capture the package name
                        const packageName = packageContainer.querySelector(".SUBCRP-itm-hdng")?.innerText.trim() || "No Package Name Found";

                        // Capture the package price (removing special characters)
                        let rawPrice = packageContainer.querySelector(".SUBCRP-price-hdng")?.innerText.trim() || "No Price Found";

                        // Extract numerical price value (keeping only digits and a single decimal point)
                        let packagePrice = rawPrice.replace(/[^\d.]/g, '');
                        packagePrice = packagePrice.replace(/^\.|(?<=\.)\.+/g, '');  // Remove multiple dots at the start

                        // Extract currency (keeping non-numeric characters)
                        let currency = rawPrice.replace(/[\d.,]/g, '').trim() || 'N/A';  // Extracts non-numeric characters as currency

                        console.log("Package Name:", packageName);
                        console.log("Price (parsed):", parseFloat(packagePrice));
                        console.log("Currency:", currency);

                        console.log("Sending event to Salesforce...");

                        function generateUniqueId() {
                            return `id_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
                        }

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Add To Cart",
                                lineItem: {
                                    // PackageName : packageName,
                                    price: parseFloat(packagePrice),
                                    catalogObjectType: "Product",
                                    catalogObjectId: generateUniqueId(),
                                    quantity: 1,

                                    attributes: {
                                        packageName4: packageName,
                                    },

                                }

                            }
                        });
                    }
                }),





                //proceed to Checkout 
                listener("click", ".SUBCRP-cart-blue-btn.slick-btn._sm-with-btn", (event) => {



                    console.log("Button clicked!"); // Check if the event fires
                    // Select the billing form container
                    const billingContainer = document.querySelector(".billingform-area");

                    if (billingContainer) {
                        console.log("Billing container found!");

                        // Extract First Name
                        const firstName = billingContainer.querySelector("input[formcontrolname='firstName']")?.value.trim() || "N/A";
                        console.log("First Name:", firstName);

                        // Extract Last Name
                        const lastName = billingContainer.querySelector("input[formcontrolname='lastName']")?.value.trim() || "N/A";
                        console.log("Last Name:", lastName);

                        // Extract Billing Phone Number
                        const phone = billingContainer.querySelector("input[formcontrolname='phone']")?.value.trim() || "N/A";

                        // Extract Country Code
                        //const countryCode = billingContainer.querySelector("select[formcontrolname='isdCode']")?.value.trim() || "N/A";

                        // Combine country code and phone number
                        const fullPhoneNumber = `${phone}`;
                        console.log("Phone:", fullPhoneNumber);

                        // Extract Email Address
                        const email = billingContainer.querySelector("input[formcontrolname='email']")?.value.trim() || "N/A";
                        console.log("Email Address:", email);

                        // Extract Pincode
                        const pincode = billingContainer.querySelector("input[formcontrolname='pincode']")?.value.trim() || "N/A";
                        console.log("Pincode:", pincode);



                        if (firstName || lastName) {

                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Checkout',
                                },
                                user: {
                                    attributes: {
                                        firstName: firstName,
                                        lastName: lastName,
                                        eventType: 'identity',
                                        isAnonymous: '0',
                                    },
                                },
                            });

                        }
                        if (fullPhoneNumber) {

                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Checkout',
                                },
                                user: {
                                    attributes: {
                                        phoneNumber: fullPhoneNumber,
                                        eventType: 'contactPointPhone',
                                    },
                                },
                            });

                        }
                        if (email) {

                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Checkout',
                                },
                                user: {
                                    attributes: {
                                        email: email,
                                        eventType: 'contactPointEmail',
                                    },
                                },
                            });

                        }
                        if (pincode) {
                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Checkout',
                                },
                                user: {
                                    attributes: {
                                        postalCode: pincode,
                                        //eventType: 'contactPointAddress',
                                        eventType: 'identity',
                                        isAnonymous: '0',
                                    },
                                },
                            });
                        }
                    }
                    // Select the billing summary container
                    const billingSummary = document.querySelector(".SUBCRP-cart-review-box");

                    if (billingSummary) {
                        console.log("Billing summary found!");

                        // Extract Subtotal
                        let subtotalraw = billingSummary.querySelector(".review-bold-text")?.innerText.trim() || "";
                        let subtotal = subtotalraw.replace(/[^\d.]/g, '');
                        subtotal = subtotal.replace(/^\.|(?<=\.)\.+/g, '');

                        // Extract Grand Total (second occurrence of .review-bold-text inside .review-blue-txt)
                        // let grandTotalElement = billingSummary.querySelectorAll(".review-blue-txt.review-bold-text");
                        // let grandTotal = grandTotalElement.length > 1
                        //     ? grandTotalElement[1].innerText.trim()
                        //     : "Grand Total not found";

                        let grandTotalElement = billingSummary.querySelectorAll(".review-blue-txt.review-bold-text");

                        let grandTotalRaw = grandTotalElement.length > 1
                            ? grandTotalElement[1].innerText.trim()
                            : "Grand Total not found";

                        // Remove all non-numeric characters except for decimals
                        let grandTotal = grandTotalRaw.replace(/[^\d.]/g, '');

                        // Ensure no multiple dots or leading dots
                        grandTotal = grandTotal.replace(/^\.|(?<=\.)\.+/g, '');

                        console.log("Grand Total:", grandTotal);

                        console.log("Subtotal:", subtotal);
                        console.log("Grand Total:", grandTotal);

                        // Store the values in an object
                        const billingDetails = {
                            subtotal,
                            grandTotal
                        };

                        const packages = document.querySelectorAll(".SUBCRP-cart-package-box");

                        let lineItems = [];

                        packages.forEach((pkg, index) => {
                            const packageName = pkg.querySelector(".SUBCRP-cart-package-name")?.innerText.trim();
                            const validTill = pkg.querySelector(".SUBCRP-package-validity.mt-2")?.innerText.replace("Valid till:", "").trim() || "N/A";
                            const startDate = pkg.querySelector(".edit-date-section .SUBCRP-package-validity")?.innerText.replace("Start Date:", "").trim() || "N/A";
                            let packagePriceText = pkg.querySelector(".SUBCRP-package-price-txt")?.innerText.trim() || "N/A";
                            let price1 = packagePriceText.replace(/[^\d.]/g, '');
                            price1 = price1.replace(/^\.|(?<=\.)\.+/g, '');


                            const validTillc = convertToISO(validTill);
                            const startDatec = convertToISO(startDate);

                            console.log("packageName:", packageName);
                            console.log("validTill:", validTill);
                            console.log("startDate:", startDate);
                            console.log("validTill:", validTillc);
                            console.log("startDate:", startDatec);
                            console.log("packagePriceText:", packagePriceText);

                            lineItems.push({
                                catalogObjectType: "Product",
                                catalogObjectId: `product-${index + 1}`,
                                quantity: 1,
                                price: parseFloat(price1),
                                attributes: {
                                    OiPackageName: packageName,
                                    StartDate1: startDatec,
                                    ValidTill1: validTillc,
                                }
                            });

                            // SalesforceInteractions.sendEvent({
                            //     interaction: {
                            //         name: 'package name captured', //change this to actual event name
                            //         eventType: 'CustomEvent',
                            //         attributes: {
                            //             PackageName: packageName,
                            //             StartDate: startDatec,
                            //             ValidTill: validTillc,
                            //             SubTotal: parseFloat(subtotal),
                            //         },
                            //     },
                            // });

                        });


                        let arraylength = lineItems.length;
                        console.log("Array Length:", arraylength);
                        console.log("arraylength:", arraylength);


                        function convertToISO(dateStr) {


                            if (dateStr === "N/A") return "N/A";


                            dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");

                            // Convert to ISO format (YYYY-MM-DD)
                            const dateObj = new Date(dateStr);
                            return dateObj.toISOString().split("T")[0];
                        }

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Purchase',
                                order: {
                                    id: new Date().getTime().toString(),
                                    totalValue: parseFloat(grandTotal),
                                    attributes: {
                                        SubTotal: parseFloat(subtotal),
                                    },
                                    lineItems
                                }
                            }
                        });



                        // SalesforceInteractions.sendEvent({
                        //     interaction: {
                        //         name: 'checkout',
                        //         eventType: 'CustomEvent',
                        //         attributes: {
                        //             Quantity: arraylength,
                        //         },
                        //     },
                        // });


                    }
                }),







                listener("click", ".subscrp-blue-bg-brdbox.pointer", (event) => {
                    const clickedElement = event.currentTarget;  // This is the `.subscrp-blue-bg-brdbox.pointer` element that was clicked.

                    // Extract payment method name from the `hdng` element inside the clicked container
                    const paymentMethod = clickedElement.querySelector('.hdng')?.innerText.trim() || "Unknown";

                    console.log("Selected Payment Method:", paymentMethod);
                    const items = document.querySelectorAll('.SUBCRP-cart-review-list li');

                    let subtotalElement1, discountElement1, grandTotalElement1;

                    items.forEach((item) => {
                        const label = item.querySelector('span')?.innerText?.trim();

                        if (label === 'Subtotal') {
                            subtotalElement1 = item.querySelector('.review-bold-text');
                        } else if (label.includes('Discount')) {
                            discountElement1 = item.querySelector('.review-bold-text');
                        } else if (label === 'Grand Total') {
                            grandTotalElement1 = item.querySelector('div.review-bold-text, div.review-blue-txt.review-bold-text');
                        }
                    });

                    let subtotalP = subtotalElement1?.innerText;
                    let finalsubtotal = subtotalP.replace(/[^\d.]/g, '');
                    finalsubtotal = finalsubtotal.replace(/^\.|(?<=\.)\.+/g, '');


                    let DiscountP = discountElement1?.innerText || 0;
                    let finaldiscount = DiscountP ? DiscountP.replace(/[^\d.]/g, '').replace(/^\.|(?<=\.)\.+/g, '') : 0;

                    let GrandTotalP = grandTotalElement1?.innerText;
                    let finalGrandTotal = GrandTotalP.replace(/[^\d.]/g, '');
                    finalGrandTotal = finalGrandTotal.replace(/^\.|(?<=\.)\.+/g, '');

                    console.log('Subtotal innerText:', finalsubtotal);
                    console.log('Discount innerText:', finaldiscount);
                    console.log('Grand Total innerText:', finalGrandTotal);


                    // Example: Send event to Salesforce (or any other tracking tool)
                    SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Payment Method",
                            eventType: "payment",
                            attributes: {
                                PaymentMethod: paymentMethod,
                                SubTotal: parseFloat(finalsubtotal),
                                Discount: parseFloat(finaldiscount),
                                GrandTotal: parseFloat(finalGrandTotal)
                            }
                        }
                    });
                }),

                // listener("click", ".subscrp-emi-bank-name-box", (event) => {

                //     console.log("In the EMI payment");
                //     const clickedBox = event.currentTarget;
                //     const methodTitle = clickedBox.querySelector('.emi-bank-title');
                //     let methodName;
                //     if (methodTitle) {
                //         methodName = methodTitle.textContent.trim();
                //         console.log(methodName); // e.g., "Jodo Cred"
                //     }
                //     const items = document.querySelectorAll('.SUBCRP-cart-review-list li');

                //     let subtotalElement1, discountElement1, grandTotalElement1;

                //     items.forEach((item) => {
                //         const label = item.querySelector('span')?.innerText?.trim();

                //         if (label === 'Subtotal') {
                //             subtotalElement1 = item.querySelector('.review-bold-text');
                //         } else if (label.includes('Discount')) {
                //             discountElement1 = item.querySelector('.review-bold-text');
                //         } else if (label === 'Grand Total') {
                //             grandTotalElement1 = item.querySelector('div.review-bold-text, div.review-blue-txt.review-bold-text');
                //         }
                //     });

                //     let subtotalP = subtotalElement1?.innerText;
                //     let finalsubtotal = subtotalP.replace(/[^\d.]/g, '');
                //     finalsubtotal = finalsubtotal.replace(/^\.|(?<=\.)\.+/g, '');


                //     let DiscountP = discountElement1?.innerText || 0;
                //     let finaldiscount = DiscountP ? DiscountP.replace(/[^\d.]/g, '').replace(/^\.|(?<=\.)\.+/g, '') : 0;

                //     let GrandTotalP = grandTotalElement1?.innerText;
                //     let finalGrandTotal = GrandTotalP.replace(/[^\d.]/g, '');
                //     finalGrandTotal = finalGrandTotal.replace(/^\.|(?<=\.)\.+/g, '');

                //     console.log('Subtotal innerText:', finalsubtotal);
                //     console.log('Discount innerText:', finaldiscount);
                //     console.log('Grand Total innerText:', finalGrandTotal);


                //     SalesforceInteractions.sendEvent({
                //         interaction: {
                //             name: "Payment Method",
                //             eventType: "payment",
                //             attributes: {
                //                 PaymentMethod: methodName,
                //                 SubTotal: parseFloat(finalsubtotal),
                //                 Discount: parseFloat(finaldiscount),
                //                 GrandTotal: parseFloat(finalGrandTotal)
                //             }
                //         }
                //     });


                // }),


            ],

        };






        // const PaymentCapture = {
        //     name: "Payment Status",
        //     isMatch: () => /\/subscription\/payementVerification/.test(window.location.href),
        //     paymentCaptured: false,  // New flag to avoid double capture

        //     observePaymentStatus: function () {
        //         console.log("PaymentCapture started");

        //         const capturePaymentStatus = () => {
        //             if (PaymentCapture.paymentCaptured) return;  // Don't capture twice

        //             const successElement = document.querySelector(".section-heading");

        //             function generateUniqueId() {
        //                 return `id_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        //             }

        //             // Payment Success Logic
        //             if (successElement && successElement.innerText.includes("Congratulation")) {
        //                 const name = successElement.innerText.replace("Congratulation, ", "").replace("!", "").trim();

        //                 const text = document.querySelector(".section-subheading.sm")?.innerText || "";

        //                 const container = document.querySelector('.center-heading-area');

        //                 let capturedAmount = "0.00";

        //                 if (container) {
        //                     const text1 = container.innerText;
        //                     console.log("Full Text:", text);

        //                     // Match amount like 38,415.02 (with or without ₹ symbol)
        //                     const amountMatch = text1.match(/(?:₹\s*)?([\d,]+\.\d{1,2})/);
        //                     capturedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : "0.00";

        //                     console.log("Captured Amount:", capturedAmount);  // Output: 38415.02
        //                 }



        //                 PaymentCapture.paymentCaptured = true;  // Prevent re-trigger
        //                 console.log(`Payment Success - Name: ${name}, Amount: ${capturedAmount}`);

        //                 // PaymentCapture.handlePaymentCaptured("Success", successAmount);

        //                 SalesforceInteractions.sendEvent({
        //                     interaction: {
        //                         name: "Payment status",
        //                         eventType: "payment",
        //                         attributes: {
        //                             PaymentStatus: "Congratulations"
        //                         }
        //                     }
        //                 });

                        
        //                 PaymentCapture.disconnectObserver();
        //                 return;
        //             }

        //             const failureElement = document.querySelector('.SUBCRP-pymnt-fail-error-msg');

        //             // Payment Failure Logic
        //             if (failureElement && failureElement.innerText.toLowerCase().includes('failed')) {
        //                 const failureText = failureElement.innerText;

        //                 const container = document.querySelector('.center-heading-area');
        //                 const text = container?.innerText || "";

        //                 // Regex to capture amount with or without ₹ symbol
        //                 const amountMatch = text.match(/(?:₹\s*)?([\d,]+\.\d+)/);

        //                 // Extract amount and remove commas
        //                 const capturedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : "0.00";

        //                 // Just log it nicely
        //                 console.log(`Captured Amount: Rs. ${capturedAmount}`);

        //                 // PaymentCapture.handlePaymentCaptured("Failed", failedAmount);

        //                 SalesforceInteractions.sendEvent({
        //                     interaction: {
        //                         name: "Payment status captured",
        //                         eventType: "payment",
        //                         attributes: {
        //                             PaymentStatus: "Failed"
        //                         }
        //                     }
        //                 });
                       

        //                 PaymentCapture.disconnectObserver();
        //                 return;
        //             }

        //             console.log("Payment status not detected yet");
        //         };

        //         // Run capture immediately
        //         capturePaymentStatus();

        //         // Set up observer for dynamically loaded content
        //         this.observer = new MutationObserver(capturePaymentStatus);
        //         this.observer.observe(document.body, { childList: true, subtree: true });
        //     },

        //     // handlePaymentCaptured: function (status, amount) {
        //     //     console.log(`Payment Captured - Status: ${status}, Amount: ₹${amount}`);
        //     //      Additional logic like analytics or tracking can go here if needed.
        //     // },

        //     disconnectObserver: function () {
        //         if (this.observer) {
        //             this.observer.disconnect();
        //             console.log("Observer disconnected to avoid double capture");
        //         }
        //     }
        // };

        // // Start capturing if on correct page
        // if (PaymentCapture.isMatch()) {
        //     PaymentCapture.observePaymentStatus();
        // }


        const DoubtsPage = {
            name: 'DoubtsPage',
            isMatch: () => /\/doubts/.test(window.location.href),

            listeners: [

                listener("click", ".subject-option", (event) => {
                    // Only proceed if the clicked element is a subject option
                    const clickedOption = event.target.closest('.subject-option');

                    if (clickedOption) {
                        // Remove 'selected' class from all subject options
                        document.querySelectorAll('.subject-option').forEach(opt => opt.classList.remove('selected'));

                        // Add 'selected' class to the clicked subject
                        clickedOption.classList.add('selected');

                        // Get the subject name and store it in sessionStorage
                        const subjectName = clickedOption.querySelector('.subjectName').innerText.trim();
                        sessionStorage.setItem('selectedSubject', subjectName);

                        console.log(`Subject selected: ${subjectName}`);
                    }
                }),

                // Listener for the ask-button to retrieve the subject from sessionStorage and send to Salesforce
                listener("click", ".ask-button", (event) => {
                    console.log("Entered in the doubt session");

                    // Retrieve the selected subject from sessionStorage
                    const selectedSubject = sessionStorage.getItem('selectedSubject');

                    if (selectedSubject) {
                        console.log(`Selected Subject: ${selectedSubject}`);

                        // Send the selected subject event to Salesforce
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Doubts',
                                eventType: 'CustomEvent',
                                attributes: {
                                    Subject: selectedSubject
                                }
                            }
                        });
                    } else {
                        console.log("No subject selected");
                    }
                }),


            ]
        };


        const selflearn = {
            name: 'SelfLearn',
            isMatch: () => /\/subject/.test(window.location.href),

            listeners: [

                listener("click", ".SLV2-chapter-box", (event) => {
                    console.log("Chapter clicked");

                    // Find the heading inside the clicked chapter
                    const chapterBox = event.target.closest(".SLV2-chapter-box");
                    const headingElement = chapterBox?.querySelector(".SLV2-chapter-info-heading");


                    const subjectElement = document.querySelector(".SLV2-page-banner-title");
                    const subject = subjectElement?.textContent.trim();
                    console.log(subject);

                    if (headingElement) {
                        const chapterName = headingElement.textContent.trim();
                        console.log(`Chapter Name: ${chapterName}`);

                        // Send the chapter click event to Salesforce
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Chapter',
                                eventType: 'CustomEvent',
                                attributes: {
                                    Subject: subject,
                                    ChapterName: chapterName
                                }
                            }
                        });
                    } else {
                        console.log("Chapter name not found");
                    }
                }),


                // listener("click", ".SLV2-popup-blue-btn", (event) => {
                //     console.log("Go to Subscriptions clicked");

                //     // Get the subject from the page banner
                //     const subjectElement = document.querySelector(".SLV2-page-banner-title");
                //     const subject = subjectElement?.textContent.trim();

                //     // Send event to Salesforce
                //     SalesforceInteractions.sendEvent({
                //         interaction: {
                //             name: 'Go To Subscriptions',
                //             eventType: 'selfLearn',
                //             attributes: {
                //                 Subject: subject || ''
                //             }
                //         }
                //     });
                // })

                listener("click", ".SLV2-popup-blue-btn", (event) => {
                    const clickedButton = event.target.closest(".SLV2-popup-blue-btn");
                    const buttonText = clickedButton?.textContent.trim();

                    // Get subject from the page banner
                    const subjectElement = document.querySelector(".SLV2-page-banner-title");
                    const subject = subjectElement?.textContent.trim() || '';

                    if (buttonText === "Go to Subscriptions") {
                        console.log("Go to Subscriptions clicked");

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Go To Subscriptions',
                                eventType: 'selfLearn',
                                attributes: {
                                    Subject: subject
                                }
                            }
                        });
                    } else if (buttonText === "Explore Chapter") {
                        console.log("Explore Chapter clicked");

                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Explore Chapter',
                                eventType: 'selfLearn',
                                attributes: {
                                    Subject: subject
                                    // You can also grab chapter name here if needed
                                }
                            }
                        });
                    } else {
                        console.log("Unknown SLV2-popup-blue-btn click");
                    }
                })


            ]
        };


        //tab trcaker

        // if (!window.__tabTrackerAttached) {
        //     window.__tabTrackerAttached = true;
        
        //     const pageLoadTime = new Date();
        //     let lastBlurTime = null;
        //     let focusEventCount = 0;
        //     let blurTimeout = null;
        //     let lastKnownState = document.hasFocus() ? 'focused' : 'blurred';
        //     let hasUserFocused = document.hasFocus();
        
        //     function convertUTCToIST(utcStr) {
        //         const utcDate = new Date(utcStr);
        //         const istOffset = 5.5 * 60 * 60 * 1000;
        //         const istDate = new Date(utcDate.getTime() + istOffset);
        //         return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        //     }
        
        //     window.addEventListener("blur", () => {
        //         const now = new Date();
        //         const timeSinceLoad = now - pageLoadTime;
        
        //         if (!hasUserFocused || timeSinceLoad < 1000) {
        //             console.log("Ignored blur: tab not focused yet or blur too early.");
        //             return;
        //         }
        
        //         blurTimeout = setTimeout(() => {
        //             const utcTime = now.toISOString();
        //             const istTime = convertUTCToIST(utcTime);
        
        //             lastBlurTime = now;
        //             lastKnownState = 'blurred';
        
        //             console.log("Tab abandoned at (UTC):", utcTime);
        //             console.log("Tab abandoned at (IST):", istTime);
        
        //             if (window.SalesforceInteractions) {
        //                 SalesforceInteractions.sendEvent({
        //                     interaction: {
        //                         name: 'Tab Abandoned',
        //                         eventType: 'CustomEvent',
        //                         attributes: {
        //                             state: 'abandoned',
        //                             timestamp: utcTime,
        //                             path: window.location.pathname
        //                         }
        //                     }
        //                 });
        //             }
        //         }, 200);
        //     });
        
        //     window.addEventListener("focus", () => {
        //         hasUserFocused = true;
        
        //         if (blurTimeout) {
        //             clearTimeout(blurTimeout);
        //             blurTimeout = null;
        //         }
        
        //         const now = new Date();
        //         const utcTime = now.toISOString();
        //         const istTime = convertUTCToIST(utcTime);
        //         const timeAway = lastBlurTime ? Math.round((now - lastBlurTime) / 1000) : 0;
        
        //         if (lastKnownState !== 'focused' && focusEventCount < 10) {
        //             console.log("Tab focused at (UTC):", utcTime, `| Time away: ${timeAway}s`);
        //             console.log("Tab focused at (IST):", istTime);
        
        //             if (window.SalesforceInteractions) {
        //                 SalesforceInteractions.sendEvent({
        //                     interaction: {
        //                         name: 'Tab Focused',
        //                         eventType: 'CustomEvent',
        //                         attributes: {
        //                             state: 'focused',
        //                             timestamp: utcTime,
        //                             path: window.location.pathname,
        //                             timeAwayInSeconds: timeAway
        //                         }
        //                     }
        //                 });
        //             }
        
        //             focusEventCount++;
        //             lastKnownState = 'focused';
        //         }
        
        //         lastBlurTime = null;
        //     });
        // }
        
        //working tab activity

        // if (!window.__tabTrackerAttached) {
        //     window.__tabTrackerAttached = true;
        
        //     const pageLoadTime = new Date();
        //     let lastHiddenTime = null;
        //     let focusEventCount = 0;
        //     let hasUserInteracted = document.visibilityState === 'visible';
        
        //     function convertUTCToIST(utcStr) {
        //         const utcDate = new Date(utcStr);
        //         const istOffset = 5.5 * 60 * 60 * 1000;
        //         const istDate = new Date(utcDate.getTime() + istOffset);
        //         return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        //     }
        
        //     document.addEventListener('visibilitychange', function () {
        //         const now = new Date();
        //         const utcTime = now.toISOString();
        //         const istTime = convertUTCToIST(utcTime);
        //         const timeSinceLoad = now - pageLoadTime;
        
        //         if (document.visibilityState === 'hidden') {
        //             if (!hasUserInteracted || timeSinceLoad < 1000) {
        //                 console.log("Ignored hidden event: too early or no interaction.");
        //                 return;
        //             }
        
        //             lastHiddenTime = now;
        //             console.log('User has switched to another tab (UTC):', utcTime);
        //             console.log('User has switched to another tab (IST):', istTime);
        
        //             if (window.SalesforceInteractions) {
        //                 SalesforceInteractions.sendEvent({
        //                     interaction: {
        //                         name: 'Tab Abandoned',
        //                         eventType: 'CustomEvent',
        //                         attributes: {
        //                             state: 'abandoned',
        //                             timestamp: utcTime,
        //                             path: window.location.pathname
        //                         }
        //                     }
        //                 });
        //             }
        //         } else if (document.visibilityState === 'visible') {
        //             hasUserInteracted = true;
        //             const timeAway = lastHiddenTime ? Math.round((now - lastHiddenTime) / 1000) : 0;
        
        //             if (focusEventCount < 10) {
        //                 console.log('User is back on the tab (UTC):', utcTime, `| Time away: ${timeAway}s`);
        //                 console.log('User is back on the tab (IST):', istTime);
        
        //                 if (window.SalesforceInteractions) {
        //                     SalesforceInteractions.sendEvent({
        //                         interaction: {
        //                             name: 'Tab Focused',
        //                             eventType: 'CustomEvent',
        //                             attributes: {
        //                                 state: 'focused',
        //                                 timestamp: utcTime,
        //                                 path: window.location.pathname,
        //                                 timeAwayInSeconds: timeAway
        //                             }
        //                         }
        //                     });
        //                 }
        
        //                 focusEventCount++;
        //             }
        
        //             lastHiddenTime = null;
        //         }
        //     });
        // }
        


        if (!window.__tabTrackerAttached) {
            window.__tabTrackerAttached = true;
        
            const pageLoadTime = new Date();
            let lastHiddenTime = null;
            let focusEventCount = 0;
            let hasUserInteracted = document.visibilityState === 'visible';
        
            function convertUTCToIST(utcStr) {
                const utcDate = new Date(utcStr);
                return utcDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            }
        
            document.addEventListener('visibilitychange', function () {
                const now = new Date();
                const utcTime = now.toISOString();
                const istTime = convertUTCToIST(utcTime);
                const timeSinceLoad = now - pageLoadTime;
        
                if (document.visibilityState === 'hidden') {
                    if (!hasUserInteracted || timeSinceLoad < 1000) {
                        console.log("Ignored hidden event: too early or no interaction.");
                        return;
                    }
        
                    lastHiddenTime = now;
                    console.log('User has switched to another tab (UTC):', utcTime);
                    console.log('User has switched to another tab (IST):', istTime);
        
                    if (window.SalesforceInteractions) {
                        SalesforceInteractions.sendEvent({
                            interaction: {
                                name: 'Tab Abandoned',
                                eventType: 'tabTracker',
                                attributes: {
                                    Tabstate: 'abandoned',
                                    TimeStamp: utcTime,
                                    Url: window.location.pathname
                                }
                            }
                        });
                    }
                } else if (document.visibilityState === 'visible') {
                    hasUserInteracted = true;
                    const timeAway = lastHiddenTime ? Math.round((now - lastHiddenTime) / 1000) : 0;
        
                    if (focusEventCount < 10) {
                        console.log('User is back on the tab (UTC):', utcTime, `| Time away: ${timeAway}s`);
                        console.log('User is back on the tab (IST):', istTime);
        
                        if (window.SalesforceInteractions) {
                            SalesforceInteractions.sendEvent({
                                interaction: {
                                    name: 'Tab Focused',
                                    eventType: 'tabTracker',
                                    attributes: {
                                        Tabstate: 'focused',
                                        TimeStamp: utcTime,
                                        Url: window.location.pathname,
                                        TimeAway1: timeAway
                                    }
                                }
                            });
                        }
        
                        focusEventCount++;
                    }
        
                    lastHiddenTime = null;
                }
            });
        }
        
        
        const pageTypeDefault = {
            name: 'default'
        }

        SalesforceInteractions.initSitemap({
            global,
            pageTypeDefault,
            pageTypes: [ReportPage, ViewReportPage, RegistrationSuccessful123, homepage, StudentPage, Subscription, DoubtsPage, selflearn]
        })

    });
});